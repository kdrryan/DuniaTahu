// Kategori rasa penasaran. Label & emoji masih dipakai untuk menandai fakta harian.
export const CATEGORIES = [
  {
    id: 'semua',
    label: 'Semua',
    emoji: '🌍',
    prompt: 'semua bidang (campur)',
    chip: 'bg-foreground text-background',
  },
  {
    id: 'sains',
    label: 'Sains',
    emoji: '🧪',
    prompt: 'sains & fisika sehari-hari',
    chip: 'bg-foreground/8 text-foreground/65',
  },
  {
    id: 'sejarah',
    label: 'Sejarah',
    emoji: '🏺',
    prompt: 'sejarah dunia',
    chip: 'bg-foreground/8 text-foreground/65',
  },
  {
    id: 'alam',
    label: 'Alam',
    emoji: '🌿',
    prompt: 'alam, hewan & tumbuhan',
    chip: 'bg-foreground/8 text-foreground/65',
  },
  {
    id: 'teknologi',
    label: 'Teknologi',
    emoji: '🤖',
    prompt: 'teknologi & cara kerja mesin',
    chip: 'bg-foreground/8 text-foreground/65',
  },
  {
    id: 'tubuh',
    label: 'Tubuh',
    emoji: '🫀',
    prompt: 'tubuh manusia',
    chip: 'bg-foreground/8 text-foreground/65',
  },
  {
    id: 'angkasa',
    label: 'Luar Angkasa',
    emoji: '🚀',
    prompt: 'luar angkasa & astronomi',
    chip: 'bg-foreground/8 text-foreground/65',
  },
];

export const DEFAULT_CATEGORY = 'semua';

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}