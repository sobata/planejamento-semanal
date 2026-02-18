-- Migration: Add depende_de_item_id column to alocacao table
-- This allows linking an allocation to a dependency item that must be completed first

ALTER TABLE alocacao ADD COLUMN depende_de_item_id INTEGER REFERENCES item(id);

-- Create index for faster dependency lookups
CREATE INDEX IF NOT EXISTS idx_alocacao_depende_de ON alocacao(depende_de_item_id);
