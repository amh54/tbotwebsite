from django.db import close_old_connections, connections


class ForceCloseDbConnectionsMiddleware:
    """Aggressively close DB connections for serverless environments."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Drop stale handles before processing a request.
        close_old_connections()
        try:
            response = self.get_response(request)
            return response
        finally:
            # Ensure no connection is kept alive after the response.
            connections.close_all()
