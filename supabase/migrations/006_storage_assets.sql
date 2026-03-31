-- Bucket público para assets (vídeos, imagens da landing page)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assets', 'assets', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode ler (público)
CREATE POLICY "Public read assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

-- Política: usuários autenticados podem fazer upload
CREATE POLICY "Authenticated upload assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');

-- Política: service role pode tudo
CREATE POLICY "Service role manages assets" ON storage.objects
  FOR ALL USING (bucket_id = 'assets' AND auth.role() = 'service_role');
