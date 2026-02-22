"""add created_at and updated_at to patients

Revision ID: d4e9f1a7b823
Revises: fc3454c50cf8
Create Date: 2026-02-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd4e9f1a7b823'
down_revision: Union[str, Sequence[str], None] = 'fc3454c50cf8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use IF NOT EXISTS so this is safe to run even if the columns already exist.
    op.execute("""
        ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE patients
            DROP COLUMN IF EXISTS updated_at,
            DROP COLUMN IF EXISTS created_at
    """)
