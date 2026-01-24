export const metadata = {
  title: 'Tutoring',
  description:
    'Private tutoring services in Computer Science, History, and English.',
}

const subjects = [
  {
    name: 'Computer Science',
    description:
      'Build a strong foundation in programming and software development. I focus on practical, hands-on learning with real-world projects.',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    topics: [
      'Programming fundamentals',
      'Data structures & algorithms',
      'Web development',
      'Python & JavaScript',
      'Interview preparation',
    ],
  },
  {
    name: 'History',
    description:
      'Develop critical thinking and analytical skills through the study of historical events, movements, and primary sources.',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    topics: [
      'World history',
      'US history',
      'Research methods',
      'Essay writing',
      'Primary source analysis',
    ],
  },
  {
    name: 'English',
    description:
      'Strengthen your writing and communication skills. From grammar basics to advanced literary analysis and persuasive writing.',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    topics: [
      'Essay writing',
      'Reading comprehension',
      'Grammar & mechanics',
      'Literature analysis',
      'College application essays',
    ],
  },
]

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
      {level}
    </span>
  )
}

function SubjectCard({
  subject,
}: {
  subject: {
    name: string
    description: string
    levels: string[]
    topics: string[]
  }
}) {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {subject.name}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
        {subject.description}
      </p>

      <div className="mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
          Skill Levels
        </h3>
        <div className="flex flex-wrap gap-2">
          {subject.levels.map((level) => (
            <LevelBadge key={level} level={level} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
          Topics Covered
        </h3>
        <ul className="space-y-1">
          {subject.topics.map((topic) => (
            <li
              key={topic}
              className="text-sm text-slate-600 dark:text-slate-400 flex items-center"
            >
              <span className="w-1.5 h-1.5 bg-primary-color rounded-full mr-2 flex-shrink-0" />
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-3xl mb-4 tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Tutoring Services
      </h1>

      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
        I offer personalized one-on-one tutoring sessions tailored to your
        learning goals. Whether you&apos;re preparing for exams, building new
        skills, or need help with coursework, I&apos;m here to help you succeed.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        {subjects.map((subject) => (
          <SubjectCard key={subject.name} subject={subject} />
        ))}
      </div>

      <div className="text-center py-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">
          Ready to get started?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Book a free consultation to discuss your goals and how I can help.
        </p>
        <a
          href="https://calendly.com/jamesimcdougalljr/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
        >
          Book a Session
        </a>
      </div>
    </section>
  )
}
