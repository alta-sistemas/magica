import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
// As chaves abaixo são públicas (anon) e seguras para uso no frontend,
// pois o acesso aos dados é controlado pelas políticas RLS no banco de dados.

// Tenta ler de variáveis de ambiente (se configurado), senão usa os valores diretos
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://udfkuevlnsycfgduwjpm.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmt1ZXZsbnN5Y2ZnZHV3anBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTg3NTIsImV4cCI6MjA4NjkzNDc1Mn0.-kPe6uFl_vyddHHWxmqSCyT_uK5gVy6xhfeGDRbGs9Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
