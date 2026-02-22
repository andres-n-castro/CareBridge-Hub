import os
from urllib.parse import urlparse, urlencode, urlunparse, parse_qs
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to Backend/.env")

# Convert standard postgresql:// URL to asyncpg format, stripping unsupported params
def _make_async_url(url: str) -> str:
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    parsed = urlparse(url)
    params = {k: v[0] for k, v in parse_qs(parsed.query).items()
              if k not in ("sslmode", "channel_binding")}
    return urlunparse(parsed._replace(query=urlencode(params)))

engine = create_async_engine(
    _make_async_url(DATABASE_URL),
    echo=False,
    connect_args={"ssl": True, "statement_cache_size": 0},
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
