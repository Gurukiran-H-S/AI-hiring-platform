"""Shared SQLAlchemy column types — portable across PostgreSQL and SQLite."""
import uuid
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class PortableUUID(TypeDecorator):
    """Platform-independent UUID type.

    Uses PostgreSQL native UUID on postgresql dialect, CHAR(36) on SQLite/others.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            if isinstance(value, str):
                return uuid.UUID(value)
            return value
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return uuid.UUID(value)
            except (ValueError, AttributeError):
                return value
        return value
