import { Section } from '@/features/landing/Section';

export const StatsSection = () => {
  return (
    <Section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">
            Analytics
          </span>
        </div>

        <h2 className="mb-4 text-4xl font-bold tracking-tight text-black">
          A Template Built to Convert
        </h2>

        <p className="mb-12 text-lg text-gray-600">
          Designed to guide users through your key offerings while showcasing your product's value.
        </p>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Views 24 hours</p>
              <p className="text-4xl font-bold text-black">100K</p>
              <p className="text-sm text-green-600">+20%</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-600">📊 30%</span>
              <span className="text-gray-400">vs last month</span>
            </div>
          </div>

          {/* Simple chart visualization */}
          <div className="relative h-32">
            <svg className="size-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                points="0,80 50,70 100,75 150,60 200,65 250,50 300,55 350,45 400,40"
              />
              <polyline
                fill="url(#gradient)"
                points="0,80 50,70 100,75 150,60 200,65 250,50 300,55 350,45 400,40 400,100 0,100"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="text-sm font-medium text-gray-700">Data-Driven Decisions</p>
            <p className="mt-2 text-sm text-gray-600">
              Track performance metrics instantly to optimize content and strategy.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
};
