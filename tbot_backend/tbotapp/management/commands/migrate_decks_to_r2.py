import os
import re
from urllib.parse import urlparse

import boto3
import requests
from django.core.management.base import BaseCommand

from tbotapp.models import Decklist


def slugify(value, fallback="unknown"):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or fallback


def normalize_side(side):
    value = str(side or "").strip().lower()

    if value in {"plant", "plants"}:
        return "plants"

    if value in {"zombie", "zombies"}:
        return "zombies"

    return slugify(value, "unknown")


def get_r2_client():
    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key_id = os.getenv("R2_ACCESS_KEY_ID")
    secret_access_key = os.getenv("R2_SECRET_ACCESS_KEY")

    if not account_id:
        raise RuntimeError("R2_ACCOUNT_ID is not set.")

    if not access_key_id:
        raise RuntimeError("R2_ACCESS_KEY_ID is not set.")

    if not secret_access_key:
        raise RuntimeError("R2_SECRET_ACCESS_KEY is not set.")

    return boto3.client(
        "s3",
        endpoint_url=(
            f"https://{account_id}.r2.cloudflarestorage.com"
        ),
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )


def get_r2_config():
    bucket_name = os.getenv("R2_BUCKET_NAME")
    public_url = os.getenv("R2_PUBLIC_URL")

    if not bucket_name:
        raise RuntimeError("R2_BUCKET_NAME is not set.")

    if not public_url:
        raise RuntimeError("R2_PUBLIC_URL is not set.")

    return bucket_name, public_url.rstrip("/")


def get_filename_from_url(image_url):
    parsed = urlparse(image_url)
    path = parsed.path.rstrip("/")
    filename = os.path.basename(path)

    if not filename:
        raise ValueError(
            f"Could not determine filename from URL: {image_url}"
        )

    return filename


def get_content_type(filename):
    extension = os.path.splitext(filename)[1].lower()

    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }

    return content_types.get(
        extension,
        "application/octet-stream",
    )


def get_target_key(deck):
    filename = get_filename_from_url(deck.image)

    side_slug = normalize_side(deck.side)

    hero_slug = slugify(
        deck.hero,
        "unknown-hero",
    )

    return (
        f"decks/"
        f"{side_slug}/"
        f"{hero_slug}/"
        f"{filename}"
    )


def verify_object(r2_client, bucket_name, key, expected_size=None):
    result = r2_client.head_object(
        Bucket=bucket_name,
        Key=key,
    )

    actual_size = result.get(
        "ContentLength",
        0,
    )

    if expected_size is not None:
        if actual_size != expected_size:
            raise RuntimeError(
                "R2 object verification failed. "
                f"Expected {expected_size} bytes, "
                f"got {actual_size} bytes."
            )

    return actual_size


class Command(BaseCommand):
    help = (
        "Safely move migrated regular deck images from "
        "tbot/decks/ to decks/ and finish Deck 8."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help=(
                "Show what would happen without copying, "
                "deleting, uploading, or changing the database."
            ),
        )

        parser.add_argument(
            "--keep-source",
            action="store_true",
            help=(
                "Keep the old tbot/decks/ objects after "
                "successful migration."
            ),
        )

        parser.add_argument(
            "--deck",
            type=int,
            default=None,
            help="Only process one specific deck ID.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        keep_source = options["keep_source"]
        specific_deck = options["deck"]

        r2_client = get_r2_client()
        bucket_name, public_url = get_r2_config()

        queryset = (
            Decklist.objects
            .exclude(image__isnull=True)
            .exclude(image="")
            .order_by("deckid")
        )

        if specific_deck is not None:
            queryset = queryset.filter(
                deckid=specific_deck
            )

        decks = list(queryset)

        if not decks:
            self.stdout.write(
                self.style.WARNING(
                    "No deck images found to process."
                )
            )
            return

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Found {len(decks)} deck image(s) to inspect."
            )
        )
        self.stdout.write("")

        moved = 0
        completed = 0
        skipped = 0
        failed = 0

        for deck in decks:
            image_url = str(deck.image or "").strip()

            self.stdout.write(
                f"Deck {deck.deckid}: "
                f"{deck.side} | "
                f"{deck.hero} | "
                f"{deck.name}"
            )

            try:
                target_key = get_target_key(deck)
                target_url = f"{public_url}/{target_key}"

                is_old_r2 = (
                    image_url.startswith(
                        f"{public_url}/tbot/decks/"
                    )
                )

                is_correct_r2 = (
                    image_url == target_url
                )

                is_cloudinary = (
                    "res.cloudinary.com" in image_url
                )

                self.stdout.write(
                    f"  Current: {image_url}"
                )

                self.stdout.write(
                    f"  Target:  {target_url}"
                )

                if is_correct_r2:
                    try:
                        verify_object(
                            r2_client,
                            bucket_name,
                            target_key,
                        )

                        skipped += 1

                        self.stdout.write(
                            self.style.SUCCESS(
                                "  ALREADY CORRECT: "
                                "R2 object verified."
                            )
                        )

                    except Exception as exc:
                        failed += 1

                        self.stdout.write(
                            self.style.ERROR(
                                f"  FAILED verification: {exc}"
                            )
                        )

                    self.stdout.write("")
                    continue

                if is_old_r2:
                    source_key = image_url.replace(
                        f"{public_url}/",
                        "",
                        1,
                    )

                    self.stdout.write(
                        f"  Source key: {source_key}"
                    )

                    if dry_run:
                        self.stdout.write(
                            self.style.WARNING(
                                "  [DRY RUN] Would copy source "
                                "to target and update database."
                            )
                        )
                        self.stdout.write("")
                        continue

                    source_head = r2_client.head_object(
                        Bucket=bucket_name,
                        Key=source_key,
                    )

                    source_size = source_head.get(
                        "ContentLength",
                        0,
                    )

                    destination_exists = False

                    try:
                        destination_head = r2_client.head_object(
                            Bucket=bucket_name,
                            Key=target_key,
                        )

                        destination_size = (
                            destination_head.get(
                                "ContentLength",
                                0,
                            )
                        )

                        destination_exists = True

                        if destination_size != source_size:
                            raise RuntimeError(
                                "Destination object already exists "
                                "but its size does not match the "
                                "source object. "
                                f"Source: {source_size} bytes, "
                                f"destination: "
                                f"{destination_size} bytes."
                            )

                        self.stdout.write(
                            self.style.SUCCESS(
                                "  Destination already exists "
                                "with matching size."
                            )
                        )

                    except r2_client.exceptions.ClientError as exc:
                        error_code = str(
                            exc.response.get(
                                "Error",
                                {},
                            ).get(
                                "Code",
                                "",
                            )
                        )

                        if error_code not in {
                            "404",
                            "NoSuchKey",
                            "NotFound",
                        }:
                            raise

                    if not destination_exists:
                        r2_client.copy_object(
                            Bucket=bucket_name,
                            CopySource={
                                "Bucket": bucket_name,
                                "Key": source_key,
                            },
                            Key=target_key,
                            ContentType=get_content_type(
                                target_key
                            ),
                        )

                        verify_object(
                            r2_client,
                            bucket_name,
                            target_key,
                            expected_size=source_size,
                        )

                        self.stdout.write(
                            self.style.SUCCESS(
                                "  SUCCESS: destination copied "
                                "and verified."
                            )
                        )

                    deck.image = target_url
                    deck.save(
                        update_fields=["image"]
                    )

                    moved += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            "  SUCCESS: database updated."
                        )
                    )

                    if not keep_source:
                        r2_client.delete_object(
                            Bucket=bucket_name,
                            Key=source_key,
                        )

                        self.stdout.write(
                            self.style.SUCCESS(
                                "  SUCCESS: old source object "
                                "deleted."
                            )
                        )

                    completed += 1

                    self.stdout.write("")
                    continue

                if deck.deckid == 8 and is_cloudinary:
                    self.stdout.write(
                        "  Deck 8 detected: "
                        "uploading remaining Cloudinary image "
                        "directly to correct R2 path."
                    )

                    if dry_run:
                        self.stdout.write(
                            self.style.WARNING(
                                "  [DRY RUN] Would download "
                                "Cloudinary image and upload "
                                "it to the target."
                            )
                        )
                        self.stdout.write("")
                        continue

                    response = requests.get(
                        image_url,
                        timeout=30,
                    )

                    response.raise_for_status()

                    image_data = response.content

                    if not image_data:
                        raise RuntimeError(
                            "Downloaded Cloudinary image was empty."
                        )

                    uploaded_size = len(image_data)

                    destination_exists = False

                    try:
                        destination_head = r2_client.head_object(
                            Bucket=bucket_name,
                            Key=target_key,
                        )

                        destination_size = (
                            destination_head.get(
                                "ContentLength",
                                0,
                            )
                        )

                        destination_exists = True

                        if destination_size != uploaded_size:
                            raise RuntimeError(
                                "Destination object already exists "
                                "but its size does not match the "
                                "Cloudinary image. "
                                f"Cloudinary: {uploaded_size} bytes, "
                                f"destination: "
                                f"{destination_size} bytes."
                            )

                        self.stdout.write(
                            self.style.SUCCESS(
                                "  Destination already exists "
                                "with matching size."
                            )
                        )

                    except r2_client.exceptions.ClientError as exc:
                        error_code = str(
                            exc.response.get(
                                "Error",
                                {},
                            ).get(
                                "Code",
                                "",
                            )
                        )

                        if error_code not in {
                            "404",
                            "NoSuchKey",
                            "NotFound",
                        }:
                            raise

                    if not destination_exists:
                        r2_client.put_object(
                            Bucket=bucket_name,
                            Key=target_key,
                            Body=image_data,
                            ContentType=get_content_type(
                                target_key
                            ),
                        )

                        verify_object(
                            r2_client,
                            bucket_name,
                            target_key,
                            expected_size=uploaded_size,
                        )

                        self.stdout.write(
                            self.style.SUCCESS(
                                "  SUCCESS: Deck 8 uploaded "
                                "and verified."
                            )
                        )

                    deck.image = target_url
                    deck.save(
                        update_fields=["image"]
                    )

                    moved += 1
                    completed += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            "  SUCCESS: Deck 8 database "
                            "updated."
                        )
                    )

                    self.stdout.write("")
                    continue

                skipped += 1

                self.stdout.write(
                    self.style.WARNING(
                        "  SKIPPED: image is not one of the "
                        "expected migration states."
                    )
                )

            except requests.RequestException as exc:
                failed += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"  FAILED Cloudinary download: {exc}"
                    )
                )

            except Exception as exc:
                failed += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"  FAILED: {exc}"
                    )
                )

            self.stdout.write("")

        self.stdout.write("=" * 60)
        self.stdout.write("Migration complete.")
        self.stdout.write(f"Moved:      {moved}")
        self.stdout.write(f"Completed:  {completed}")
        self.stdout.write(f"Skipped:    {skipped}")
        self.stdout.write(f"Failed:     {failed}")
        self.stdout.write("=" * 60)

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "DRY RUN ONLY — no R2 objects or database "
                    "records were changed."
                )
            )