from rest_framework import serializers

from .models import (
    Decklist,
    WebCards,
    KeepOrScrap,
    UserDeck,
    LegacyDecklist,
    UserProfile,
)


# ============================================================
# PUBLIC DECK SERIALIZERS
# ============================================================

class PublicDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Decklist
        fields = [
            "deckid",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "creator",
            "cost",
            "aliases",
            "cards",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]


class PublicLegacyDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegacyDecklist
        fields = [
            "deckid",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "creator",
            "cost",
            "cards",
            "aliases",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]


# ============================================================
# ADMIN DECKLIST SERIALIZERS
# ============================================================

class AdminDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Decklist
        fields = [
            "deckid",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "creator",
            "cost",
            "aliases",
            "cards",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]


class AdminLegacyDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegacyDecklist
        fields = [
            "deckid",
            "side",
            "hero",
            "name",
            "category",
            "archetype",
            "description",
            "deck_doc",
            "image",
            "creator",
            "optimization",
            "inspiration",
            "cost",
            "aliases",
            "cards",
            "suggested_date",
            "updated_date",
        ]


# ============================================================
# USER DECK
# ============================================================

class UserDeckSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserDeck
        fields = [
            "id",
            "profile_id",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "cost",
            "aliases",
            "cards",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
            "created_at",
            "modified_at",
        ]

        read_only_fields = [
            "id",
            "profile_id",
            "created_at",
            "modified_at",
        ]

    def validate(self, attrs):
        cards = attrs.get("cards")

        if cards is None:
            return attrs

        if isinstance(cards, str):
            lines = cards.splitlines()

        elif isinstance(cards, list):
            lines = cards

        else:
            raise serializers.ValidationError({
                "cards": "Cards must be a valid card ratio list."
            })

        total = 0

        for line in lines:

            if not line:
                continue

            if isinstance(line, str):

                parts = line.split("|", 1)

                if len(parts) != 2:
                    raise serializers.ValidationError({
                        "cards": f"Invalid card ratio: {line}"
                    })

                card_name = parts[0].strip()

                try:
                    ratio = int(parts[1].strip())

                except (TypeError, ValueError):
                    raise serializers.ValidationError({
                        "cards": f"Invalid ratio for {card_name}."
                    })

            elif isinstance(line, dict):

                card_name = str(
                    line.get("name")
                    or line.get("card_name")
                    or ""
                ).strip()

                try:
                    ratio = int(line.get("count", 0))

                except (TypeError, ValueError):
                    raise serializers.ValidationError({
                        "cards": f"Invalid ratio for {card_name}."
                    })

            else:
                raise serializers.ValidationError({
                    "cards": "Invalid card ratio format."
                })

            if not card_name:
                raise serializers.ValidationError({
                    "cards": "Every card must have a name."
                })

            if ratio < 1 or ratio > 4:
                raise serializers.ValidationError({
                    "cards": (
                        f"{card_name} must have a ratio between "
                        "1 and 4."
                    )
                })

            total += ratio

        if total != 40:
            raise serializers.ValidationError({
                "cards": (
                    f"Card ratios must add up to 40. "
                    f"Currently they add up to {total}."
                )
            })

        return attrs


# ============================================================
# USER PROFILE
# ============================================================

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile

        fields = [
            "id",
            "discord_id",
            "profile_slug",
            "display_name",
            "bio",
            "avatar",
            "is_public",
            "created_at",
            "updated_at",
        ]


# ============================================================
# PUBLIC WEB CARDS
# ============================================================

class WebCardSerializer(serializers.ModelSerializer):

    class Meta:
        model = WebCards

        fields = [
            "cardid",
            "card_type",
            "card_name",
            "side",
            "title",
            "stats",
            "description",
            "ability",
            "thumbnail",
            "traits",
            "set_rarity",
            "flavor_text",
            "aliases",
            "button",
            "button_emoji",
            "button2",
            "button_emoji2",
        ]


# ============================================================
# ADMIN WEB CARDS
# ============================================================

class AdminCardSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    card_classes = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = WebCards

        fields = [
            "cardid",
            "card_type",
            "card_classes",
            "card_name",
            "side",
            "title",
            "stats",
            "description",
            "ability",
            "thumbnail",
            "image_file",
            "traits",
            "set_rarity",
            "flavor_text",
            "aliases",
            "button",
            "button_emoji",
            "button2",
            "button_emoji2",
        ]

        # card_type is generated by the serializer.
        # cardid must NOT be read-only because Add Card supplies it.
        read_only_fields = [
            "card_type",
        ]

    # ============================================================
    # VALIDATION
    # ============================================================

    def validate_card_classes(self, value):
        allowed_classes = {
            "Guardian",
            "Smarty",
            "Kabloom",
            "Mega-Grow",
            "Solar",
            "Beastly",
            "Sneaky",
            "Crazy",
            "Hearty",
            "Brainy",
        }

        cleaned = []

        for item in value:
            class_name = str(item).strip()

            if not class_name:
                continue

            matching = next(
                (
                    allowed
                    for allowed in allowed_classes
                    if allowed.lower() == class_name.lower()
                ),
                None,
            )

            if not matching:
                raise serializers.ValidationError(
                    f"Invalid card class: {class_name}"
                )

            if matching not in cleaned:
                cleaned.append(matching)

        if not cleaned:
            raise serializers.ValidationError(
                "At least one card class is required."
            )

        if len(cleaned) > 2:
            raise serializers.ValidationError(
                "A card can have at most two classes."
            )

        return cleaned

    def validate_side(self, value):
        value = str(value or "").strip()

        if value not in {"Plants", "Zombies"}:
            raise serializers.ValidationError(
                "Side must be Plants or Zombies."
            )

        return value

    def validate_card_name(self, value):
        value = str(value or "").strip()

        if not value:
            raise serializers.ValidationError(
                "Card name is required."
            )

        return value

    def validate_cardid(self, value):
        if value is None:
            raise serializers.ValidationError(
                "Card ID is required."
            )

        if int(value) < 1:
            raise serializers.ValidationError(
                "Card ID must be greater than 0."
            )

        if WebCards.objects.filter(cardid=value).exists():
            raise serializers.ValidationError(
                "A card with this Card ID already exists."
            )

        return value

    def validate_thumbnail(self, value):
        if value is None:
            return ""

        return str(value).strip()

    # ============================================================
    # CREATE
    # ============================================================

    def create(self, validated_data):
        image_file = validated_data.pop(
            "image_file",
            None,
        )

        card_classes = validated_data.pop(
            "card_classes",
            None,
        )

        if not card_classes:
            raise serializers.ValidationError({
                "card_classes": "At least one card class is required."
            })

        # Generate card_type automatically.
        validated_data["card_type"] = " ".join(card_classes)

        # If a file was explicitly selected, upload it.
        if image_file:
            validated_data["thumbnail"] = self._upload_image(
                image_file
            )

        return WebCards.objects.create(
            **validated_data
        )

    # ============================================================
    # UPDATE
    # ============================================================

    def update(self, instance, validated_data):
        image_file = validated_data.pop(
            "image_file",
            None,
        )

        card_classes = validated_data.pop(
            "card_classes",
            None,
        )

        # If classes were provided, regenerate card_type.
        if card_classes is not None:
            validated_data["card_type"] = " ".join(
                card_classes
            )

        # IMPORTANT:
        #
        # No new file selected:
        #     keep existing thumbnail untouched.
        #
        # New file selected:
        #     upload it and replace thumbnail.
        if image_file:
            validated_data["thumbnail"] = self._upload_image(
                image_file
            )
        else:
            validated_data.pop(
                "thumbnail",
                None,
            )

        return super().update(
            instance,
            validated_data,
        )

    # ============================================================
    # CLOUDINARY
    # ============================================================

    @staticmethod
    def _upload_image(image_file):
        try:
            import cloudinary.uploader

            result = cloudinary.uploader.upload(
                image_file,
                folder="pvzhtbot/cards",
                resource_type="image",
            )

            secure_url = result.get("secure_url")

            if not secure_url:
                raise serializers.ValidationError(
                    {
                        "image_file": (
                            "Cloudinary did not return an image URL."
                        )
                    }
                )

            return secure_url

        except serializers.ValidationError:
            raise

        except Exception as exc:
            raise serializers.ValidationError(
                {
                    "image_file": (
                        f"Cloudinary upload failed: {exc}"
                    )
                }
            )


# ============================================================
# KEEP OR SCRAP
# ============================================================

class KeepOrScrapSerializer(serializers.ModelSerializer):

    class Meta:
        model = KeepOrScrap

        fields = [
            "tierid",
            "side",
            "card_class",
            "image",
            "reasoning",
            "creator",
        ]