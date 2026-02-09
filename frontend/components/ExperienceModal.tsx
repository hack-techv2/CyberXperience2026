'use client';

interface ExperienceModalProps {
  onSelect: (level: 'beginner' | 'experienced') => void;
}

export default function ExperienceModal({ onSelect }: ExperienceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-terminal-cyan mb-2">
            Welcome to CyberXperience!
          </h2>
          <p className="text-gray-400 text-sm">
            Before we begin, let us know your experience level with terminals.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Beginner Option */}
          <button
            onClick={() => onSelect('beginner')}
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-terminal-purple hover:bg-gray-800/80 transition-all group text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍼</span>
              <div>
                <h3 className="text-terminal-purple font-bold text-lg group-hover:text-terminal-purple/90">
                  I&apos;m New Here
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Start with the Baby Shell tutorial to learn terminal basics like{' '}
                  <code className="text-terminal-cyan">ls</code>,{' '}
                  <code className="text-terminal-cyan">cd</code>, and{' '}
                  <code className="text-terminal-cyan">cat</code>.
                </p>
              </div>
            </div>
          </button>

          {/* Experienced Option */}
          <button
            onClick={() => onSelect('experienced')}
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-terminal-cyan hover:bg-gray-800/80 transition-all group text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <h3 className="text-terminal-cyan font-bold text-lg group-hover:text-terminal-cyan/90">
                  I Know My Way
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Jump straight into the CTF challenges. You&apos;re comfortable with
                  command-line interfaces and ready for security puzzles.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-gray-600 text-xs mt-6">
          You can always access the Baby Shell tutorial from the tabs above.
        </p>
      </div>
    </div>
  );
}
