import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// IMPORTANTE: Substitua as strings abaixo pelas chaves do seu projeto Supabase.
// Você encontra isso em: Project Settings > API
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://udfkuevlnsycfgduwjpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmt1ZXZsbnN5Y2ZnZHV3anBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTg3NTIsImV4cCI6MjA4NjkzNDc1Mn0.-kPe6uFl_vyddHHWxmqSCyT_uK5gVy6xhfeGDRbGs9Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
