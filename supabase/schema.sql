-- Constellation Database Schema

-- Create constellations table
CREATE TABLE IF NOT EXISTS constellations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  starmap_id TEXT,
  status TEXT CHECK (status IN ('draft', 'processing', 'completed', 'archived')) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media_items table
CREATE TABLE IF NOT EXISTS media_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  constellation_id UUID REFERENCES constellations(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('text', 'document', 'video', 'audio', 'image', 'link', 'other')) NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  content TEXT,
  user_context TEXT,
  ai_analysis JSONB,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning_artifacts table
CREATE TABLE IF NOT EXISTS learning_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  constellation_id UUID REFERENCES constellations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create starmaps table (shared with Polaris)
CREATE TABLE IF NOT EXISTS starmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  modules JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_constellations_user_id ON constellations(user_id);
CREATE INDEX idx_constellations_status ON constellations(status);
CREATE INDEX idx_media_items_constellation_id ON media_items(constellation_id);
CREATE INDEX idx_learning_artifacts_constellation_id ON learning_artifacts(constellation_id);
CREATE INDEX idx_starmaps_created_by ON starmaps(created_by);

-- Row Level Security (RLS)
ALTER TABLE constellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE starmaps ENABLE ROW LEVEL SECURITY;

-- Policies for constellations
CREATE POLICY "Users can view their own constellations" 
  ON constellations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own constellations" 
  ON constellations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own constellations" 
  ON constellations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own constellations" 
  ON constellations FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for media_items
CREATE POLICY "Users can view media items of their constellations" 
  ON media_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = media_items.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create media items for their constellations" 
  ON media_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = media_items.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media items of their constellations" 
  ON media_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = media_items.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media items of their constellations" 
  ON media_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = media_items.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

-- Policies for learning_artifacts
CREATE POLICY "Users can view artifacts of their constellations" 
  ON learning_artifacts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = learning_artifacts.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create artifacts for their constellations" 
  ON learning_artifacts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = learning_artifacts.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update artifacts of their constellations" 
  ON learning_artifacts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = learning_artifacts.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete artifacts of their constellations" 
  ON learning_artifacts FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM constellations 
      WHERE constellations.id = learning_artifacts.constellation_id 
      AND constellations.user_id = auth.uid()
    )
  );

-- Policies for starmaps (public read, authenticated create)
CREATE POLICY "Anyone can view starmaps" 
  ON starmaps FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create starmaps" 
  ON starmaps FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own starmaps" 
  ON starmaps FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own starmaps" 
  ON starmaps FOR DELETE 
  USING (auth.uid() = created_by);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_constellations_updated_at 
  BEFORE UPDATE ON constellations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_items_updated_at 
  BEFORE UPDATE ON media_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_artifacts_updated_at 
  BEFORE UPDATE ON learning_artifacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_starmaps_updated_at 
  BEFORE UPDATE ON starmaps 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
