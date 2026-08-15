from rest_framework import serializers

from .models import Resident


class ResidentSerializer(serializers.ModelSerializer):

    full_name = serializers.CharField(
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    user_role = serializers.CharField(
        source="user.role",
        read_only=True,
    )

    user_id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    resident_type_display = serializers.CharField(
        source="get_resident_type_display",
        read_only=True,
    )

    class Meta:
        model = Resident

        fields = [
            "id",
            "user",
            "user_id",
            "username",
            "user_role",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "resident_type",
            "resident_type_display",
            "phone",
            "email",
            "address",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user_id",
            "username",
            "user_role",
            "full_name",
            "resident_type_display",
            "created_at",
            "updated_at",
        ]

    def validate_user(self, value):

        if value.role not in [
            value.Roles.HOMEOWNER,
            value.Roles.TENANT,
        ]:
            raise serializers.ValidationError(
                "The selected user must be a HOMEOWNER or TENANT."
            )

        if Resident.objects.filter(
            user=value
        ).exclude(
            pk=getattr(
                self.instance,
                "pk",
                None,
            )
        ).exists():
            raise serializers.ValidationError(
                "This user already has a resident profile."
            )

        return value

    def validate(self, attrs):

        user = attrs.get(
            "user",
            getattr(
                self.instance,
                "user",
                None,
            ),
        )

        resident_type = attrs.get(
            "resident_type",
            getattr(
                self.instance,
                "resident_type",
                None,
            ),
        )

        if user and resident_type:

            if (
                resident_type
                == Resident.ResidentType.HOMEOWNER
                and user.role
                != user.Roles.HOMEOWNER
            ):
                raise serializers.ValidationError(
                    {
                        "resident_type":
                            "A homeowner resident must use a HOMEOWNER user account."
                    }
                )

            if (
                resident_type
                == Resident.ResidentType.TENANT
                and user.role
                != user.Roles.TENANT
            ):
                raise serializers.ValidationError(
                    {
                        "resident_type":
                            "A tenant resident must use a TENANT user account."
                    }
                )

        return attrs