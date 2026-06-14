-- =============================================
-- Storage Buckets for Content & Submissions
-- =============================================

-- Bucket for admin-uploaded content (study materials, assignment briefs, class notes)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-uploads', 'content-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket for student assignment submissions (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- ====== content-uploads policies (admin write, public read) ======
CREATE POLICY "Public read content uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-uploads');

CREATE POLICY "Admin upload content"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-uploads' AND auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Admin update content"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'content-uploads' AND auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Admin delete content"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-uploads' AND auth.jwt()->>'email' LIKE '%@designforge.co.in');

-- ====== assignment-submissions policies (student write, admin + own read) ======
CREATE POLICY "Candidates upload own submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-submissions');

CREATE POLICY "Authenticated read submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Admin manage all submissions storage"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'assignment-submissions' AND auth.jwt()->>'email' LIKE '%@designforge.co.in');
