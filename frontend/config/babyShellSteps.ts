/**
 * Baby Shell Tutorial Steps Configuration
 * 10 guided steps to teach terminal basics
 */

export interface BabyShellStep {
  id: number;
  title: string;
  instruction: string;
  expectedCommand: string;
  hint: string;
  successMessage: string;
  // Optional: regex pattern for flexible matching
  pattern?: RegExp;
}

export const BABY_SHELL_STEPS: BabyShellStep[] = [
  {
    id: 1,
    title: 'Print Working Directory',
    instruction: 'Let\'s start by finding out where you are! Type "pwd" to print your current working directory.',
    expectedCommand: 'pwd',
    hint: 'Type exactly: pwd',
    successMessage: 'Great job! pwd shows you the current directory path.',
  },
  {
    id: 2,
    title: 'Who Am I?',
    instruction: 'Now let\'s find out who you are logged in as. Type "whoami" to see your username.',
    expectedCommand: 'whoami',
    hint: 'Type exactly: whoami',
    successMessage: 'You\'re logged in as "student". This command is useful for checking your identity.',
  },
  {
    id: 3,
    title: 'List Files',
    instruction: 'Let\'s see what files are in the current directory. Type "ls" to list them.',
    expectedCommand: 'ls',
    hint: 'Type exactly: ls',
    successMessage: 'ls shows all files and folders in your current directory.',
  },
  {
    id: 4,
    title: 'Echo Command',
    instruction: 'The echo command prints text to the screen. Try typing "echo Hello".',
    expectedCommand: 'echo Hello',
    pattern: /^echo\s+Hello$/i,
    hint: 'Type: echo Hello',
    successMessage: 'Echo repeats whatever you type after it. Try "echo Hello World" next time!',
  },
  {
    id: 5,
    title: 'Read a File',
    instruction: 'Let\'s read the welcome file. Type "cat welcome.txt" to see its contents.',
    expectedCommand: 'cat welcome.txt',
    hint: 'Type: cat welcome.txt',
    successMessage: 'cat displays the contents of a file. Very useful for reading text files!',
  },
  {
    id: 6,
    title: 'Get Help',
    instruction: 'Need help? Type "help" to see all available commands.',
    expectedCommand: 'help',
    hint: 'Type exactly: help',
    successMessage: 'The help command shows you all available commands. Remember this one!',
  },
  {
    id: 7,
    title: 'Go Home',
    instruction: 'Type "cd ~" to go to your home directory (the tilde ~ means home).',
    expectedCommand: 'cd ~',
    pattern: /^cd\s+~$/,
    hint: 'Type: cd ~',
    successMessage: 'The ~ symbol is a shortcut for your home directory. Very handy!',
  },
  {
    id: 8,
    title: 'Go Up',
    instruction: 'Type "cd .." to go up one directory (.. means parent directory).',
    expectedCommand: 'cd ..',
    pattern: /^cd\s+\.\.$/,
    hint: 'Type: cd ..',
    successMessage: 'Two dots (..) always means the parent directory. One dot (.) means current directory.',
  },
  {
    id: 9,
    title: 'Enter a Folder',
    instruction: 'The "documents" folder is inside /home/student. First go back there with "cd ~", then use "cd documents" to enter it.',
    expectedCommand: 'cd documents',
    hint: 'First type "cd ~" to go home, then "cd documents". Or use "cd ~/documents" in one step!',
    successMessage: 'You can cd into any folder by typing its name. Use ls to see what folders exist.',
    pattern: /^cd\s+(documents|~\/documents)$/,
  },
  {
    id: 10,
    title: 'Absolute Path Navigation',
    instruction: 'Use an absolute path to navigate directly to /home/ASG/documents. Absolute paths start with "/" and specify the full location.',
    expectedCommand: 'cd /home/ASG/documents',
    hint: 'Type: cd /home/ASG/documents (absolute paths always start with /)',
    successMessage: 'Congratulations! You\'ve completed the Baby Shell tutorial! You now know the basics including absolute paths.',
    pattern: /^cd\s+\/home\/ASG\/documents\/?$/,
  },
];

/**
 * Check if a command matches the expected command for a step
 */
export function matchesStepCommand(step: BabyShellStep, command: string): boolean {
  const trimmed = command.trim();

  // If there's a pattern, use it
  if (step.pattern) {
    return step.pattern.test(trimmed);
  }

  // Otherwise, exact match (case-insensitive for command name)
  return trimmed.toLowerCase() === step.expectedCommand.toLowerCase();
}
