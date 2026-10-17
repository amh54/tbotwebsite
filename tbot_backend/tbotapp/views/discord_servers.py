
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def discord_servers(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    description,
                    discord_url,
                    server_icon
                FROM discord_servers
                ORDER BY name ASC
                """
            )

            columns = [column[0] for column in cursor.description]
            servers = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]

        return JsonResponse({"servers": servers})

    except Exception:
        return JsonResponse(
            {"error": "Unable to load Discord servers."},
            status=500,
        )
