-- Schema do Sistema de Planejamento Semanal
-- SQLite

-- Setores (departamentos)
CREATE TABLE IF NOT EXISTS setor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    ordem INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pessoas (colaboradores)
CREATE TABLE IF NOT EXISTS pessoa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    setor_id INTEGER NOT NULL,
    ativo INTEGER DEFAULT 1,
    ordem INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (setor_id) REFERENCES setor(id)
);

CREATE INDEX IF NOT EXISTS idx_pessoa_setor ON pessoa(setor_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ativo ON pessoa(ativo);

-- Itens (catálogo de atividades)
CREATE TABLE IF NOT EXISTS item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    setor_sugerido_id INTEGER,
    cor TEXT DEFAULT '#6366f1',
    ativo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (setor_sugerido_id) REFERENCES setor(id)
);

CREATE INDEX IF NOT EXISTS idx_item_setor_sugerido ON item(setor_sugerido_id);
CREATE INDEX IF NOT EXISTS idx_item_ativo ON item(ativo);

-- Semanas (períodos de planejamento)
CREATE TABLE IF NOT EXISTS semana (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_inicio DATE NOT NULL UNIQUE,
    data_fim DATE NOT NULL,
    status TEXT DEFAULT 'aberta' CHECK(status IN ('aberta', 'fechada')),
    fechada_em DATETIME,
    fechada_por TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_semana_data_inicio ON semana(data_inicio);
CREATE INDEX IF NOT EXISTS idx_semana_status ON semana(status);

-- Alocações (pessoa + dia + item)
-- status_execucao: 'pendente' (default), 'realizado', 'nao_realizado'
CREATE TABLE IF NOT EXISTS alocacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semana_id INTEGER NOT NULL,
    pessoa_id INTEGER NOT NULL,
    data DATE NOT NULL,
    item_id INTEGER NOT NULL,
    ordem INTEGER DEFAULT 0,
    status_execucao TEXT DEFAULT 'pendente' CHECK(status_execucao IN ('pendente', 'realizado', 'nao_realizado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semana_id) REFERENCES semana(id) ON DELETE CASCADE,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(id),
    FOREIGN KEY (item_id) REFERENCES item(id),
    UNIQUE(semana_id, pessoa_id, data, item_id)
);

CREATE INDEX IF NOT EXISTS idx_alocacao_semana ON alocacao(semana_id);
CREATE INDEX IF NOT EXISTS idx_alocacao_pessoa ON alocacao(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_alocacao_data ON alocacao(data);
CREATE INDEX IF NOT EXISTS idx_alocacao_semana_pessoa ON alocacao(semana_id, pessoa_id);

-- Observações (por pessoa/semana)
CREATE TABLE IF NOT EXISTS observacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semana_id INTEGER NOT NULL,
    pessoa_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semana_id) REFERENCES semana(id) ON DELETE CASCADE,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(id),
    UNIQUE(semana_id, pessoa_id)
);

CREATE INDEX IF NOT EXISTS idx_observacao_semana ON observacao(semana_id);
CREATE INDEX IF NOT EXISTS idx_observacao_semana_pessoa ON observacao(semana_id, pessoa_id);

-- Triggers para updated_at
CREATE TRIGGER IF NOT EXISTS update_setor_timestamp
AFTER UPDATE ON setor
BEGIN
    UPDATE setor SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_pessoa_timestamp
AFTER UPDATE ON pessoa
BEGIN
    UPDATE pessoa SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_item_timestamp
AFTER UPDATE ON item
BEGIN
    UPDATE item SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_semana_timestamp
AFTER UPDATE ON semana
BEGIN
    UPDATE semana SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_observacao_timestamp
AFTER UPDATE ON observacao
BEGIN
    UPDATE observacao SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_alocacao_timestamp
AFTER UPDATE ON alocacao
BEGIN
    UPDATE alocacao SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
