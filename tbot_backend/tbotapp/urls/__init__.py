from .admin import urlpatterns as admin_urls
from .auth import urlpatterns as auth_urls
from .bugs import urlpatterns as bug_urls
from .deckbuilders import urlpatterns as deckbuilder_urls
from .profiles import urlpatterns as profile_urls
from .public import urlpatterns as public_urls
from .saved_decks import urlpatterns as saved_deck_urls
from .suggestions import urlpatterns as suggestion_urls
from .user_cards import urlpatterns as user_card_urls
from .user_decks import urlpatterns as user_deck_urls


urlpatterns = (
    public_urls
    + auth_urls
    + admin_urls
    + bug_urls
    + profile_urls
    + deckbuilder_urls
    + user_deck_urls
    + user_card_urls
    + saved_deck_urls
    + suggestion_urls
)