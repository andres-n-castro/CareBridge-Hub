"""add transcript status progress medications columns

Revision ID: fc3454c50cf8
Revises: 1f544872c62a
Create Date: 2026-02-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fc3454c50cf8'
down_revision: Union[str, Sequence[str], None] = '1f544872c62a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('patients', sa.Column('transcript', sa.Text(), nullable=True))
    op.add_column('patients', sa.Column('status', sa.String(50), nullable=False, server_default='pending'))
    op.add_column('patients', sa.Column('progress', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('patients', sa.Column('medications', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))


def downgrade() -> None:
    op.drop_column('patients', 'medications')
    op.drop_column('patients', 'progress')
    op.drop_column('patients', 'status')
    op.drop_column('patients', 'transcript')
