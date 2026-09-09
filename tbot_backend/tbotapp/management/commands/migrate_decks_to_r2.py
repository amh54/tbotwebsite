import mimetypes
import os
import re
from urllib.parse import urlparse

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.core.management.base import BaseCommand

from ...models import UserDeck


R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "")
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or "untitled"


def normalize_side(value):
    value = str(value or "").strip().lower()

    if value in {"plant", "plants"}:
        return "plants"

    if value in {"zombie", "zombies"}:
        return "zombies"

    return slugify(value)


def normalize_hero(value):
    return slugify(value)


def get_filename(image_url):
    path = urlparse(image_url).path
    filename = os.path.basename(path)

    if not filename:
        return None

    filename = filename.split("?")[0].split("#")[0]

    if not filename:
        return None

    filename = re.sub(r"[^a-zA-Z0-9._-]+", "-", filename)
    filename = filename.strip("-")

    return filename or None


def get_extension(filename):
    extension = os.path.splitext(filename)[1].lower()

    if extension in CONTENT_TYPES:
        return extension

    return extension or ".webp"


def get_content_type(filename):
    extension = os.path.splitext(filename)[1].lower()

    if extension in CONTENT_TYPES:
        return CONTENT_TYPES[extension]

    return mimetypes.guess_type(filename)[0] or "application/octet-stream"


def build_filename(deck):
    name = slugify(deck.name)
    extension = get_extension(get_filename(deck.image) or "")

    return f"{name}-{deck.id}{extension}"


class Command(BaseCommand):
    help = "Rename user deck images in Cloudflare R2 using deck names."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--deck", type=int)

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        deck_id = options["deck"]

        required = {
            "R2_PUBLIC_URL": R2_PUBLIC_URL,
            "R2_ACCOUNT_ID": R2_ACCOUNT_ID,
            "R2_ACCESS_KEY_ID": R2_ACCESS_KEY_ID,
            "R2_SECRET_ACCESS_KEY": R2_SECRET_ACCESS_KEY,
            "R2_BUCKET_NAME": R2_BUCKET_NAME,
        }

        missing = [name for name, value in required.items() if not value]

        if missing:
            raise RuntimeError(
                "Missing required environment variables: "
                + ", ".join(missing)
            )

        s3 = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )

        queryset = UserDeck.objects.all().order_by("id")

        if deck_id is not None:
            queryset = queryset.filter(id=deck_id)

        total = queryset.count()

        if total == 0:
            self.stdout.write(
                self.style.WARNING("No user decks found.")
            )
            return

        successful = 0
        skipped = 0
        failed = 0

        self.stdout.write(
            f"Found {total} user deck(s) to process."
        )

        for deck in queryset:
            image_url = str(deck.image or "").strip()

            if not image_url:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"SKIP {deck.id} | {deck.name} | no image URL"
                    )
                )
                continue

            old_filename = get_filename(image_url)

            if not old_filename:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"FAIL {deck.id} | {deck.name} | "
                        "could not determine filename"
                    )
                )
                continue

            side = normalize_side(deck.side)
            hero = normalize_hero(deck.hero)
            new_filename = build_filename(deck)

            old_key = None

            if image_url.startswith(R2_PUBLIC_URL + "/"):
                old_key = image_url[len(R2_PUBLIC_URL) + 1:]

            if not old_key:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"FAIL {deck.id} | {deck.name} | "
                        "image is not an R2 URL: {image_url}"
                    )
                )
                continue

            new_key = (
                f"user_decks/{side}/{hero}/{new_filename}"
            )

            new_url = f"{R2_PUBLIC_URL}/{new_key}"

            if old_key == new_key:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"SKIP {deck.id} | {deck.name} | "
                        f"already named {new_filename}"
                    )
                )
                continue

            self.stdout.write(
                f"{'DRY RUN ' if dry_run else ''}"
                f"{deck.id} | {deck.side} | {deck.hero} | {deck.name}"
            )

            self.stdout.write(
                f"  Old: {R2_PUBLIC_URL}/{old_key}"
            )

            self.stdout.write(
                f"  New: {new_url}"
            )

            if dry_run:
                successful += 1
                continue

            try:
                head = s3.head_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=old_key,
                )

                copy_source = {
                    "Bucket": R2_BUCKET_NAME,
                    "Key": old_key,
                }

                s3.copy_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=new_key,
                    CopySource=copy_source,
                    ContentType=get_content_type(new_filename),
                    MetadataDirective="REPLACE",
                    CacheControl="public, max-age=31536000, immutable",
                )

                new_head = s3.head_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=new_key,
                )

                old_size = int(head.get("ContentLength", 0))
                new_size = int(new_head.get("ContentLength", 0))

                if old_size != new_size:
                    raise RuntimeError(
                        "R2 verification failed: "
                        f"old object is {old_size} bytes, "
                        f"new object is {new_size} bytes."
                    )

                deck.image = new_url
                deck.save(update_fields=["image"])

                s3.delete_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=old_key,
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"  Renamed and verified: {new_url}"
                    )
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        "  Database updated."
                    )
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        "  Old R2 object deleted."
                    )
                )

                successful += 1

            except (
                BotoCoreError,
                ClientError,
                RuntimeError,
            ) as exc:
                failed += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"  FAILED: {exc}"
                    )
                )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS("Migration complete.")
        )
        self.stdout.write(f"Successful: {successful}")
        self.stdout.write(f"Skipped: {skipped}")
        self.stdout.write(f"Failed: {failed}")