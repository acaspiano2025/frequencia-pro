-- Script SQL para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Tabela de Membros
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  evaluation_rule TEXT NOT NULL CHECK (evaluation_rule IN ('AMBAS', '5A', 'SAB')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Reuniões
CREATE TABLE IF NOT EXISTS meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME,
  weekday TEXT NOT NULL CHECK (weekday IN ('5A', 'SAB', 'DOM')),
  kind TEXT NOT NULL CHECK (kind IN ('NORMAL', 'OBRIGACAO', 'DESENVOLVIMENTO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Registros de Frequência
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('OK', 'FALTA_SEM', 'FALTA_JUST')),
  justification_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, meeting_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON attendance_records(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Permitir todas as operações para usuários autenticados
CREATE POLICY "Users can view all members" ON members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert members" ON members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update members" ON members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete members" ON members FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all meetings" ON meetings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert meetings" ON meetings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update meetings" ON meetings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete meetings" ON meetings FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all attendance" ON attendance_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert attendance" ON attendance_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update attendance" ON attendance_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete attendance" ON attendance_records FOR DELETE USING (auth.role() = 'authenticated');



