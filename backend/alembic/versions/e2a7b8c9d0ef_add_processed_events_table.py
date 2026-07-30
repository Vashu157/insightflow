"""add processed events table

Revision ID: e2a7b8c9d0ef
Revises: f198b1b229bc
Create Date: 2026-07-31 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e2a7b8c9d0ef'
down_revision: Union[str, None] = 'f198b1b229bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('processed_events',
    sa.Column('event_id', sa.String(), nullable=False),
    sa.Column('processed_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('event_id')
    )
    op.create_index(op.f('ix_processed_events_event_id'), 'processed_events', ['event_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_processed_events_event_id'), table_name='processed_events')
    op.drop_table('processed_events')
