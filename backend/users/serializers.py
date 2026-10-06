from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "password",
            "confirm_password",
        ]

    def validate_email(self, value):
        value = value.lower()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        return data

    def create(self, validated_data):
        full_name = validated_data.pop("full_name")
        validated_data.pop("confirm_password")

        email = validated_data["email"].lower()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=full_name,
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="first_name")

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
        ]