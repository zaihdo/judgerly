import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key)

async function insert(table, data) {
  const { data: result, error } = await supabase.from(table).insert(data).select().single()
  if (error) {
    console.error(`ERROR inserting into ${table}:`, error.message)
    process.exit(1)
  }
  return result
}

const testData = {
  competition: {
    name: 'Test Competition 2026',
    password: 'test123'
  },
  categories: [
    {
      name: 'Category A',
      criteria: [
        { name: 'Skill', weight: 40 },
        { name: 'Creativity', weight: 35 },
        { name: 'Presentation', weight: 25 }
      ],
      tracks: [
        {
          name: 'Beginner',
          participants: ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince']
        },
        {
          name: 'Intermediate',
          participants: ['Edward Norton', 'Fiona Green', 'George White', 'Hannah Black', 'Ivan Gray']
        },
        {
          name: 'Advanced',
          participants: ['Jake Stone', 'Laura Lane', 'Mike Ross']
        }
      ]
    },
    {
      name: 'Category B',
      criteria: [
        { name: 'Accuracy', weight: 50 },
        { name: 'Speed', weight: 30 },
        { name: 'Style', weight: 20 }
      ],
      tracks: [
        {
          name: 'Junior',
          participants: ['Nina Patel', 'Oscar Wilde', 'Paula Dean', 'Quinn Adams', 'Rachel Green']
        },
        {
          name: 'Senior',
          participants: ['Sam Wilson', 'Tina Turner', 'Uma Fox', 'Victor Stone']
        },
        {
          name: 'Open',
          participants: ['Wendy Park', 'Xander Cole', 'Yasmine Ali', 'Zoe Clark', 'Aaron Davis', 'Bella Cruz']
        }
      ]
    }
  ]
}

async function seed() {
  console.log('=== Seeding Test Competition ===\n')

  console.log('Creating competition...')
  const competition = await insert('competitions', testData.competition)
  console.log(`  ✓ Competition: "${competition.name}" (ID: ${competition.id})\n`)

  for (const catData of testData.categories) {
    console.log(`Creating category: ${catData.name}`)
    const category = await insert('categories', { competition_id: competition.id, name: catData.name })
    console.log(`  ✓ Category ID: ${category.id}`)

    for (const trackData of catData.tracks) {
      const track = await insert('tracks', {
        category_id: category.id,
        name: trackData.name,
        criteria: catData.criteria
      })
      console.log(`    ✓ Track: ${track.name}`)

      for (const name of trackData.participants) {
        await insert('participants', { track_id: track.id, name })
      }
      console.log(`      ✓ ${trackData.participants.length} participants added`)
    }
    console.log()
  }

  console.log('=== Test seed complete! ===')
  console.log(`Competition ID: ${competition.id}`)
  console.log(`Password:       test123`)
  console.log(`Judge URL:      /judge`)
  console.log(`Results URL:    /results/${competition.id}`)
}

seed()
