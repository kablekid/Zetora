// =============================================================================
// Zetora DEMONSTRATION content.
//
// This is sample material so the app does not look empty during development.
// It is NOT an official or verified Ethiopian syllabus. Every row generated
// from this file is flagged is_demo = true and can be removed in one click from
// Admin → Settings → "Remove demo content".
// =============================================================================

// ---- HTML helpers (they emit exactly what the admin editor emits) ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const m = (latex) => `<span data-type="math" data-latex="${esc(latex)}"></span>`;
const mb = (latex) => `<div data-type="math-block" data-latex="${esc(latex)}"></div>`;
const callout = (variant, ...paras) =>
  `<div data-type="callout" data-variant="${variant}">${paras.map((p) => `<p>${p}</p>`).join('')}</div>`;
const def = (...p) => callout('definition', ...p);
const note = (...p) => callout('note', ...p);
const key = (...p) => callout('key', ...p);
const example = (...p) => callout('example', ...p);
const warn = (...p) => callout('warning', ...p);
const ul = (...items) => `<ul>${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ul>`;
const ol = (...items) => `<ol>${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ol>`;
const table = (head, rows) =>
  `<table><tbody><tr>${head.map((h) => `<th><p>${h}</p></th>`).join('')}</tr>` +
  rows.map((r) => `<tr>${r.map((c) => `<td><p>${c}</p></td>`).join('')}</tr>`).join('') +
  `</tbody></table>`;
const h2 = (t) => `<h2>${t}</h2>`;
const h3 = (t) => `<h3>${t}</h3>`;
const p = (t) => `<p>${t}</p>`;

// ---- Question helpers ------------------------------------------------------
// mc(body, [options], correctIndex, explanation, difficulty, topic)
const mc = (body, options, correct, explanation, difficulty = 'medium', topic = null) => ({
  type: 'multiple_choice', body, options: options.map((b, i) => ({ body: b, is_correct: i === correct })),
  explanation, difficulty, topic,
});
const tf = (body, answer, explanation, difficulty = 'easy', topic = null) => ({
  type: 'true_false', body, options: [{ body: 'True', is_correct: answer }, { body: 'False', is_correct: !answer }],
  explanation, difficulty, topic,
});
const ms = (body, options, correctIdx, explanation, difficulty = 'medium', topic = null) => ({
  type: 'multiple_select', body, options: options.map((b, i) => ({ body: b, is_correct: correctIdx.includes(i) })),
  explanation, difficulty, topic,
});
const sa = (body, accepted, explanation, difficulty = 'easy', topic = null) => ({
  type: 'short_answer', body, accepted_answers: accepted, options: [], explanation, difficulty, topic,
});

export const subjects = [
  // ===========================================================================
  {
    slug: 'mathematics', title: 'Mathematics', icon: 'sigma', color: 'indigo',
    description: 'Functions, limits, calculus and probability — the core ideas behind Grade 12 mathematics. Demo content.',
    units: [
      {
        title: 'Functions and Graphs', minutes: 40,
        description: 'Understand functions, their domain and range, and how to combine and invert them.',
        introduction: 'Functions describe how one quantity depends on another. They are the language of every later topic in calculus, so a solid grip on domain, range, composition and inverses pays off throughout the course.\n\nIn this unit you will learn to read a function, find where it is defined, combine functions, and undo them.',
        objectives: ['Define a function and decide whether a relation is a function', 'Find the domain and range of common functions', 'Compose two functions and evaluate the result', 'Find the inverse of a one-to-one function'],
        concepts: ['Domain and range', 'One-to-one functions', 'Composite functions', 'Inverse functions'],
        topics: ['Domain and range', 'Types of functions', 'Composite and inverse functions'],
        summary: [
          h2('What is a function?'),
          def('<strong>Function.</strong> A function ' + m('f') + ' assigns to every input ' + m('x') + ' in its <em>domain</em> exactly one output ' + m('f(x)') + ' in its <em>range</em>.'),
          p('A relation fails to be a function when one input produces two different outputs. The <strong>vertical line test</strong> checks this on a graph: if any vertical line crosses the curve more than once, it is not a function.'),
          h2('Domain and range'),
          p('The <strong>domain</strong> is the set of allowed inputs; the <strong>range</strong> is the set of outputs that actually occur. To find the domain, look for values that break the rules of arithmetic:'),
          ul('You cannot divide by zero.', 'You cannot take the square root of a negative number (in the real numbers).', 'You cannot take the logarithm of zero or a negative number.'),
          example('<strong>Example.</strong> Find the domain of ' + m('f(x)=\\sqrt{x-3}') + '.', 'The expression under the root must be non-negative: ' + m('x-3\\ge 0') + ', so ' + m('x\\ge 3') + '. The domain is ' + m('[3,\\infty)') + '.'),
          h2('Common functions'),
          table(['Function', 'Rule', 'Domain', 'Range'], [
            ['Linear', m('f(x)=mx+b'), 'All real numbers', 'All real numbers (if ' + m('m\\ne 0') + ')'],
            ['Quadratic', m('f(x)=ax^2+bx+c'), 'All real numbers', 'Bounded on one side'],
            ['Square root', m('f(x)=\\sqrt{x}'), m('x\\ge 0'), m('y\\ge 0')],
            ['Reciprocal', m('f(x)=\\frac{1}{x}'), m('x\\ne 0'), m('y\\ne 0')],
          ]),
          h2('Composite functions'),
          p('Composing two functions means feeding the output of one into the other:'),
          mb('(f\\circ g)(x)=f\\big(g(x)\\big)'),
          note('Order matters. In general ' + m('f(g(x))') + ' is not the same as ' + m('g(f(x))') + '. Always work from the inside out.'),
          example('<strong>Example.</strong> Let ' + m('f(x)=2x+1') + ' and ' + m('g(x)=x^2') + '. Then ' + m('(f\\circ g)(3)=f(9)=19') + ' while ' + m('(g\\circ f)(3)=g(7)=49') + '.'),
          h2('Inverse functions'),
          def('<strong>Inverse.</strong> If ' + m('f') + ' is one-to-one, its inverse ' + m('f^{-1}') + ' reverses it: ' + m('f^{-1}(f(x))=x') + '.'),
          p('To find an inverse, follow three steps:'),
          ol('Write ' + m('y=f(x)') + '.', 'Swap ' + m('x') + ' and ' + m('y') + '.', 'Solve for ' + m('y') + '.'),
          key('Only <strong>one-to-one</strong> functions have inverses. The graph of ' + m('f^{-1}') + ' is the reflection of the graph of ' + m('f') + ' in the line ' + m('y=x') + '.'),
        ].join(''),
        quiz: {
          title: 'Functions and Graphs — practice quiz', mode: 'practice', time: null, pass: 60,
          questions: [
            mc('What is the domain of $f(x)=\\sqrt{x-3}$?', ['$x \\ge 3$', '$x > 3$', '$x \\le 3$', 'All real numbers'], 0, 'The radicand must be non-negative, so $x-3 \\ge 0$, giving $x \\ge 3$.', 'easy', 'Domain and range'),
            mc('If $f(x)=2x+1$ and $g(x)=x^2$, what is $(f\\circ g)(2)$?', ['5', '9', '25', '8'], 1, '$g(2)=4$, then $f(4)=2(4)+1=9$.', 'medium', 'Composite and inverse functions'),
            tf('Every function has an inverse function.', false, 'Only one-to-one functions have inverses. For example, $f(x)=x^2$ gives the same output for $2$ and $-2$.', 'easy', 'Composite and inverse functions'),
            mc('What is the inverse of $f(x)=3x-6$?', ['$\\frac{x-6}{3}$', '$\\frac{x+6}{3}$', '$3x+6$', '$\\frac{1}{3x-6}$'], 1, 'Set $y=3x-6$, swap to $x=3y-6$, solve: $y=\\frac{x+6}{3}$.', 'medium', 'Composite and inverse functions'),
            ms('Which of these functions are one-to-one on all real numbers? (Select all that apply.)', ['$f(x)=x^3$', '$f(x)=2x+5$', '$f(x)=x^2$', '$f(x)=|x|$'], [0, 1], '$x^3$ and $2x+5$ never repeat an output. $x^2$ and $|x|$ both send $2$ and $-2$ to the same value.', 'medium', 'Types of functions'),
            sa('If $f(x)=x^2-4$, what is $f(-3)$? (Number only.)', ['5'], '$f(-3)=(-3)^2-4=9-4=5$.', 'easy', 'Types of functions'),
          ],
        },
      },
      {
        title: 'Limits and Continuity', minutes: 45,
        description: 'Build the idea of a limit, use the limit laws, and decide when a function is continuous.',
        introduction: 'A limit describes what value a function approaches as its input gets close to some point — even if the function never reaches it. Limits are the foundation of the derivative and the integral.\n\nThis unit covers the intuition, the algebra for evaluating limits, and the idea of continuity.',
        objectives: ['Explain a limit informally and read limits from a graph', 'Evaluate limits using the limit laws and algebraic simplification', 'State the three conditions for continuity at a point'],
        concepts: ['Left and right limits', 'Limit laws', 'Indeterminate forms', 'Continuity'],
        topics: ['The idea of a limit', 'Limit laws', 'Continuity'],
        summary: [
          h2('The idea of a limit'),
          def('<strong>Limit.</strong> We write ' + m('\\lim_{x\\to a} f(x)=L') + ' when ' + m('f(x)') + ' gets arbitrarily close to ' + m('L') + ' as ' + m('x') + ' gets close to ' + m('a') + ' (but not necessarily equal to ' + m('a') + ').'),
          p('The limit exists only if the <strong>left-hand</strong> and <strong>right-hand</strong> limits agree.'),
          h2('Limit laws'),
          p('If ' + m('\\lim f(x)') + ' and ' + m('\\lim g(x)') + ' exist, then:'),
          ul(m('\\lim [f(x)+g(x)]=\\lim f(x)+\\lim g(x)'), m('\\lim [c\\,f(x)]=c\\,\\lim f(x)'), m('\\lim [f(x)\\,g(x)]=\\lim f(x)\\cdot\\lim g(x)'), m('\\lim \\frac{f(x)}{g(x)}=\\frac{\\lim f(x)}{\\lim g(x)}') + ' provided ' + m('\\lim g(x)\\ne 0')),
          h2('Evaluating tricky limits'),
          p('Direct substitution sometimes gives ' + m('\\tfrac{0}{0}') + '. This is an <em>indeterminate form</em>: it tells you to simplify, not that the limit is undefined.'),
          example('<strong>Example.</strong> Evaluate ' + m('\\lim_{x\\to 2}\\frac{x^2-4}{x-2}') + '.', 'Factor: ' + m('\\frac{(x-2)(x+2)}{x-2}=x+2') + ' for ' + m('x\\ne 2') + '. So the limit is ' + m('2+2=4') + '.'),
          h2('Two limits worth remembering'),
          mb('\\lim_{x\\to 0}\\frac{\\sin x}{x}=1'),
          h2('Continuity'),
          def('<strong>Continuous at a point.</strong> A function ' + m('f') + ' is continuous at ' + m('x=a') + ' when all three hold:'),
          ol(m('f(a)') + ' is defined.', m('\\lim_{x\\to a} f(x)') + ' exists.', m('\\lim_{x\\to a} f(x)=f(a)') + '.'),
          warn('A hole, a jump, or a vertical asymptote each break one of these three conditions.'),
        ].join(''),
        quiz: {
          title: 'Limits and Continuity — timed quiz', mode: 'exam', time: 10, pass: 60,
          questions: [
            mc('What is $\\lim_{x\\to 2}\\frac{x^2-4}{x-2}$?', ['0', '2', '4', 'It does not exist'], 2, 'Factor the numerator: $(x-2)(x+2)/(x-2)=x+2$, which tends to $4$.', 'medium', 'The idea of a limit'),
            mc('What is $\\lim_{x\\to 0}\\frac{\\sin x}{x}$?', ['0', '1', '$\\infty$', 'It does not exist'], 1, 'This is a standard limit and equals $1$.', 'easy', 'The idea of a limit'),
            tf('If $f(a)$ is undefined, then $\\lim_{x\\to a} f(x)$ cannot exist.', false, 'A limit describes the behaviour near $a$, not at $a$. A function can have a hole at $a$ and still have a limit there.', 'medium', 'The idea of a limit'),
            mc('Which set of conditions defines continuity of $f$ at $x=a$?', ['$f(a)$ is defined only', 'The limit exists only', '$f(a)$ is defined, the limit exists, and they are equal', 'The graph can be drawn without lifting the pencil only on one side'], 2, 'All three conditions must hold together.', 'medium', 'Continuity'),
            ms('Which limit laws are valid whenever the individual limits exist? (Select all that apply.)', ['Sum law', 'Constant-multiple law', 'Quotient law even when the denominator\'s limit is $0$', 'Product law'], [0, 1, 3], 'The quotient law requires the denominator\'s limit to be non-zero.', 'medium', 'Limit laws'),
            sa('Evaluate $\\lim_{x\\to 3}(2x+1)$. (Number only.)', ['7'], 'By direct substitution, $2(3)+1=7$.', 'easy', 'Limit laws'),
          ],
        },
      },
      { title: 'Differentiation', minutes: 50, description: 'Derivatives as rates of change, the differentiation rules, and applications.', introduction: 'The derivative measures how fast a quantity is changing. This unit introduces derivatives from limits and builds the toolkit of rules used to differentiate functions quickly.', objectives: ['Interpret the derivative as a rate of change and a slope', 'Apply the power, product, quotient and chain rules'], concepts: ['Derivative', 'Tangent line', 'Chain rule'], topics: ['The derivative from first principles', 'Differentiation rules', 'Applications of derivatives'] },
      { title: 'Integration', minutes: 50, description: 'Antiderivatives, definite integrals and areas under curves.', introduction: 'Integration reverses differentiation and measures accumulation, such as the area under a curve.', objectives: ['Find antiderivatives of basic functions', 'Evaluate definite integrals'], concepts: ['Antiderivative', 'Definite integral', 'Area under a curve'], topics: ['Indefinite integrals', 'Definite integrals', 'Area between curves'] },
      { title: 'Probability', minutes: 35, description: 'Counting, probability rules and conditional probability.', introduction: 'Probability gives a numerical measure of how likely events are. You will use counting techniques and the rules of probability.', objectives: ['Use permutations and combinations', 'Apply the addition and multiplication rules'], concepts: ['Sample space', 'Conditional probability', 'Independent events'], topics: ['Counting principles', 'Rules of probability', 'Conditional probability'] },
    ],
  },
  // ===========================================================================
  {
    slug: 'physics', title: 'Physics', icon: 'atom', color: 'violet',
    description: 'Motion, forces, energy and electricity explained step by step, with worked examples. Demo content.',
    units: [
      {
        title: 'Kinematics in One Dimension', minutes: 35,
        description: 'Describe motion in a straight line using displacement, velocity and acceleration.',
        introduction: 'Kinematics describes motion without asking what causes it. We use a small set of quantities — displacement, velocity and acceleration — and three equations that connect them when acceleration is constant.',
        objectives: ['Distinguish distance from displacement and speed from velocity', 'Use the equations of motion for constant acceleration', 'Analyse free fall near the Earth\'s surface'],
        concepts: ['Vector vs scalar', 'Uniform acceleration', 'Free fall'],
        topics: ['Displacement, velocity and acceleration', 'Equations of motion', 'Free fall'],
        summary: [
          h2('Describing motion'),
          table(['Quantity', 'Symbol', 'SI unit', 'Type'], [
            ['Displacement', m('s'), 'metre (m)', 'Vector'],
            ['Velocity', m('v'), 'm/s', 'Vector'],
            ['Speed', '—', 'm/s', 'Scalar'],
            ['Acceleration', m('a'), 'm/s²', 'Vector'],
          ]),
          def('<strong>Acceleration.</strong> The rate of change of velocity: ' + m('a=\\dfrac{\\Delta v}{\\Delta t}') + '.'),
          h2('Equations of motion (constant acceleration)'),
          p('Let ' + m('u') + ' be the initial velocity, ' + m('v') + ' the final velocity, ' + m('a') + ' the acceleration, ' + m('t') + ' the time and ' + m('s') + ' the displacement.'),
          mb('v=u+at'),
          mb('s=ut+\\tfrac{1}{2}at^2'),
          mb('v^2=u^2+2as'),
          key('These three equations only apply when acceleration is <strong>constant</strong>. Choose the one that does not contain the quantity you were not given.'),
          example('<strong>Example.</strong> A car starts from rest and accelerates at ' + m('2\\ \\text{m/s}^2') + ' for ' + m('5\\ \\text{s}') + '.', 'Final velocity: ' + m('v=0+2\\times5=10\\ \\text{m/s}') + '. Distance: ' + m('s=\\tfrac12\\times2\\times5^2=25\\ \\text{m}') + '.'),
          h2('Free fall'),
          p('Near the surface of the Earth every freely falling object has the same downward acceleration, ' + m('g\\approx 9.8\\ \\text{m/s}^2') + ', if air resistance is ignored.'),
          note('Choose a sign convention (for example, up is positive) and keep it for the whole problem.'),
        ].join(''),
        quiz: {
          title: 'Kinematics — practice quiz', mode: 'practice', time: null, pass: 60,
          questions: [
            mc('A car accelerates uniformly from rest at $2\\ \\text{m/s}^2$ for $5\\ \\text{s}$. What is its final velocity?', ['5 m/s', '10 m/s', '20 m/s', '25 m/s'], 1, '$v=u+at=0+2\\times5=10\\ \\text{m/s}$.', 'easy', 'Equations of motion'),
            mc('How far does the same car travel in those $5\\ \\text{s}$?', ['10 m', '25 m', '50 m', '12.5 m'], 1, '$s=ut+\\tfrac12at^2=\\tfrac12(2)(25)=25\\ \\text{m}$.', 'medium', 'Equations of motion'),
            tf('Velocity is a scalar quantity.', false, 'Velocity has both magnitude and direction, so it is a vector. Speed is its scalar counterpart.', 'easy', 'Displacement, velocity and acceleration'),
            mc('An object is dropped from rest. Ignoring air resistance ($g=9.8\\ \\text{m/s}^2$), what is its speed after $3\\ \\text{s}$?', ['9.8 m/s', '19.6 m/s', '29.4 m/s', '44.1 m/s'], 2, '$v=gt=9.8\\times3=29.4\\ \\text{m/s}$.', 'medium', 'Free fall'),
            ms('Which of these are vector quantities? (Select all that apply.)', ['Displacement', 'Velocity', 'Speed', 'Acceleration'], [0, 1, 3], 'Speed has magnitude only, so it is a scalar.', 'easy', 'Displacement, velocity and acceleration'),
            sa('What is the SI unit of acceleration? (Write it like m/s^2.)', ['m/s^2', 'm/s²', 'ms^-2', 'm s^-2', 'm/s2'], 'Acceleration is velocity (m/s) per second, giving m/s².', 'easy', 'Displacement, velocity and acceleration'),
          ],
        },
      },
      {
        title: 'Newton\'s Laws and Dynamics', minutes: 45,
        description: 'Understand why objects move: forces, mass, weight, friction and Newton\'s three laws.',
        introduction: 'Dynamics links motion to its causes. Newton\'s three laws explain how forces change the motion of objects, and give us a method for solving problems involving weight, friction and tension.',
        objectives: ['State Newton\'s three laws and give examples', 'Use ' + 'F = ma to solve problems', 'Calculate weight and friction forces'],
        concepts: ['Inertia', 'Net force', 'Action–reaction pairs', 'Friction'],
        topics: ['First law and inertia', 'Second law: F = ma', 'Third law and friction'],
        summary: [
          h2('Newton\'s three laws'),
          def('<strong>First law (inertia).</strong> An object stays at rest, or moves at constant velocity, unless a net external force acts on it.'),
          def('<strong>Second law.</strong> The acceleration of an object is proportional to the net force and inversely proportional to its mass: ' + m('F_{net}=ma') + '.'),
          def('<strong>Third law.</strong> If object A exerts a force on object B, then B exerts an equal and opposite force on A.'),
          note('The two forces of a third-law pair act on <strong>different</strong> objects, so they never cancel each other out.'),
          h2('Weight, mass and friction'),
          table(['Quantity', 'Formula', 'Notes'], [
            ['Weight', m('W=mg'), 'A force; measured in newtons (N)'],
            ['Friction', m('f=\\mu N'), m('\\mu') + ' is the coefficient of friction'],
            ['Net force', m('F_{net}=\\sum F'), 'Add forces as vectors'],
          ]),
          example('<strong>Example.</strong> What force gives a ' + m('4\\ \\text{kg}') + ' trolley an acceleration of ' + m('3\\ \\text{m/s}^2') + '?', m('F=ma=4\\times3=12\\ \\text{N}') + '.'),
          h2('Problem-solving routine'),
          ol('Draw a free-body diagram showing every force on the object.', 'Choose axes and resolve forces into components.', 'Apply ' + m('F_{net}=ma') + ' along each axis.', 'Solve and check the units.'),
        ].join(''),
        quiz: {
          title: 'Newton\'s Laws — timed quiz', mode: 'exam', time: 10, pass: 60,
          questions: [
            mc('What net force gives a $4\\ \\text{kg}$ mass an acceleration of $3\\ \\text{m/s}^2$?', ['7 N', '12 N', '1.33 N', '0.75 N'], 1, '$F=ma=4\\times3=12\\ \\text{N}$.', 'easy', 'Second law: F = ma'),
            mc('What is the weight of a $10\\ \\text{kg}$ object on Earth ($g=9.8\\ \\text{m/s}^2$)?', ['10 N', '98 N', '9.8 N', '980 N'], 1, '$W=mg=10\\times9.8=98\\ \\text{N}$.', 'easy', 'Second law: F = ma'),
            tf('The action and reaction forces of Newton\'s third law act on the same object.', false, 'They act on different objects, which is why they do not cancel.', 'medium', 'Third law and friction'),
            mc('Inertia is the tendency of an object to…', ['accelerate when pushed', 'resist changes in its state of motion', 'fall towards the Earth', 'lose energy as heat'], 1, 'Inertia is resistance to changes in motion; mass measures it.', 'easy', 'First law and inertia'),
            ms('Which are examples of Newton\'s third law? (Select all that apply.)', ['A rocket\'s exhaust pushes the rocket forward', 'Your foot pushes the ground backwards when you walk', 'A book resting on a table: gravity and the table\'s normal force', 'A swimmer pushes water backwards and moves forward'], [0, 1, 3], 'Gravity and the normal force on a resting book act on the same object, so they are not a third-law pair.', 'hard', 'Third law and friction'),
            sa('What force (in newtons, number only) is needed to accelerate a $2\\ \\text{kg}$ mass at $5\\ \\text{m/s}^2$?', ['10'], '$F=ma=2\\times5=10\\ \\text{N}$.', 'easy', 'Second law: F = ma'),
          ],
        },
      },
      { title: 'Work, Energy and Power', minutes: 40, description: 'Work done by a force, kinetic and potential energy, conservation of energy and power.', introduction: 'Energy is one of the most powerful ideas in physics. This unit connects force and motion through work and energy.', objectives: ['Calculate work done by a force', 'Apply conservation of mechanical energy'], concepts: ['Work', 'Kinetic energy', 'Potential energy', 'Power'], topics: ['Work done by a force', 'Kinetic and potential energy', 'Power and efficiency'] },
      { title: 'Current Electricity', minutes: 45, description: 'Current, voltage, resistance and simple circuits.', introduction: 'Electric circuits power the modern world. Learn Ohm\'s law and how to analyse series and parallel circuits.', objectives: ['Apply Ohm\'s law', 'Combine resistors in series and parallel'], concepts: ['Current', 'Voltage', 'Resistance', 'Ohm\'s law'], topics: ['Current and voltage', 'Ohm\'s law', 'Series and parallel circuits'] },
      { title: 'Waves and Sound', minutes: 35, description: 'Wave properties, the wave equation, sound and resonance.', introduction: 'Waves transfer energy without transferring matter. We study their properties and the behaviour of sound.', objectives: ['Use the wave equation', 'Describe reflection, refraction and diffraction'], concepts: ['Wavelength', 'Frequency', 'Wave speed'], topics: ['Wave properties', 'Sound waves', 'Resonance'] },
    ],
  },
  // ===========================================================================
  {
    slug: 'chemistry', title: 'Chemistry', icon: 'flask-conical', color: 'blue',
    description: 'Atomic structure, bonding, reactions and the mole — the essentials of Grade 12 chemistry. Demo content.',
    units: [
      {
        title: 'Atomic Structure', minutes: 35,
        description: 'Subatomic particles, isotopes, electron configuration and the periodic table.',
        introduction: 'Everything around us is built from atoms. Understanding what is inside an atom explains the periodic table and why elements behave the way they do.',
        objectives: ['Describe protons, neutrons and electrons', 'Write electron configurations for the first 20 elements', 'Explain isotopes and calculate neutron numbers'],
        concepts: ['Atomic number', 'Mass number', 'Isotopes', 'Electron configuration'],
        topics: ['Subatomic particles', 'Electron configuration', 'The periodic table'],
        summary: [
          h2('Inside the atom'),
          table(['Particle', 'Charge', 'Relative mass', 'Location'], [
            ['Proton', '+1', '1', 'Nucleus'],
            ['Neutron', '0', '1', 'Nucleus'],
            ['Electron', '−1', '≈ 1/1836', 'Shells around the nucleus'],
          ]),
          def('<strong>Atomic number (Z)</strong> is the number of protons. <strong>Mass number (A)</strong> is the number of protons plus neutrons.'),
          example('<strong>Example.</strong> For ' + m('^{23}_{11}\\text{Na}') + ': protons = 11, electrons (neutral atom) = 11, neutrons = ' + m('23-11=12') + '.'),
          h2('Isotopes'),
          p('Isotopes are atoms of the same element (same ' + m('Z') + ') with different numbers of neutrons. They have the same chemical properties but different masses.'),
          h2('Electron configuration'),
          p('Electrons fill shells and sub-shells in order of increasing energy: ' + m('1s,\\,2s,\\,2p,\\,3s,\\,3p,\\,4s,\\,3d') + '.'),
          table(['Element', 'Z', 'Configuration'], [
            ['Oxygen', '8', m('1s^2\\,2s^2\\,2p^4')],
            ['Sodium', '11', m('1s^2\\,2s^2\\,2p^6\\,3s^1')],
            ['Chlorine', '17', m('1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^5')],
          ]),
          key('Elements in the same group have the same number of <strong>valence electrons</strong>, which is why they react in similar ways.'),
        ].join(''),
        quiz: {
          title: 'Atomic Structure — practice quiz', mode: 'practice', time: null, pass: 60,
          questions: [
            mc('Which subatomic particle carries a negative charge?', ['Proton', 'Neutron', 'Electron', 'Nucleus'], 2, 'Electrons carry a charge of −1.', 'easy', 'Subatomic particles'),
            mc('How many neutrons are in an atom of $^{23}_{11}\\text{Na}$?', ['11', '12', '23', '34'], 1, 'Neutrons = mass number − atomic number = 23 − 11 = 12.', 'medium', 'Subatomic particles'),
            tf('Isotopes of an element have different numbers of protons.', false, 'Isotopes have the same number of protons but different numbers of neutrons.', 'easy', 'Subatomic particles'),
            mc('What is the electron configuration of oxygen ($Z=8$)?', ['$1s^2\\,2s^2\\,2p^6$', '$1s^2\\,2s^2\\,2p^4$', '$1s^2\\,2s^2\\,2p^2$', '$1s^2\\,2s^1\\,2p^5$'], 1, 'Eight electrons: two in 1s, two in 2s, four in 2p.', 'medium', 'Electron configuration'),
            ms('Which of these elements are halogens (group 17)? (Select all that apply.)', ['Fluorine', 'Chlorine', 'Sodium', 'Bromine'], [0, 1, 3], 'Sodium is an alkali metal (group 1).', 'easy', 'The periodic table'),
            sa('How many electrons does a neutral atom of magnesium ($Z=12$) have? (Number only.)', ['12'], 'A neutral atom has as many electrons as protons.', 'easy', 'Subatomic particles'),
          ],
        },
      },
      {
        title: 'Chemical Bonding', minutes: 40,
        description: 'Ionic, covalent and metallic bonds, molecular shape and polarity.',
        introduction: 'Atoms combine to reach more stable electron arrangements. How they do so — by transferring or sharing electrons — determines the properties of the substances they form.',
        objectives: ['Distinguish ionic from covalent bonding', 'Predict simple molecular shapes', 'Explain how bonding affects properties'],
        concepts: ['Ionic bond', 'Covalent bond', 'Electronegativity', 'Molecular shape'],
        topics: ['Ionic bonding', 'Covalent bonding', 'Molecular shape and polarity'],
        summary: [
          h2('Why atoms bond'),
          p('Atoms bond to reach a full outer shell — usually eight electrons (the <em>octet rule</em>), or two for hydrogen and helium.'),
          h2('Ionic bonding'),
          def('<strong>Ionic bond.</strong> The electrostatic attraction between oppositely charged ions formed when one atom transfers electrons to another.'),
          p('Sodium gives one electron to chlorine: ' + m('\\text{Na}\\rightarrow \\text{Na}^+ + e^-') + ' and ' + m('\\text{Cl}+e^-\\rightarrow \\text{Cl}^-') + '. The result, NaCl, is a crystal lattice with a high melting point.'),
          h2('Covalent bonding'),
          def('<strong>Covalent bond.</strong> A shared pair of electrons between two non-metal atoms.'),
          table(['Molecule', 'Bond type', 'Shape'], [
            ['Hydrogen, ' + m('\\text{H}_2'), 'Single', 'Linear'],
            ['Oxygen, ' + m('\\text{O}_2'), 'Double', 'Linear'],
            ['Nitrogen, ' + m('\\text{N}_2'), 'Triple', 'Linear'],
            ['Water, ' + m('\\text{H}_2\\text{O}'), 'Single (×2)', 'Bent'],
            ['Methane, ' + m('\\text{CH}_4'), 'Single (×4)', 'Tetrahedral'],
          ]),
          key('Large electronegativity difference → ionic. Small difference → covalent. Unequal sharing → <strong>polar</strong> covalent bond.'),
          note('Lone pairs repel more strongly than bonding pairs, which is why water is bent rather than linear.'),
        ].join(''),
        quiz: {
          title: 'Chemical Bonding — timed quiz', mode: 'exam', time: 10, pass: 60,
          questions: [
            mc('What type of bond holds sodium chloride (NaCl) together?', ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], 0, 'Sodium transfers an electron to chlorine, forming oppositely charged ions.', 'easy', 'Ionic bonding'),
            mc('Which molecule contains a triple bond?', ['$\\text{O}_2$', '$\\text{H}_2$', '$\\text{N}_2$', '$\\text{Cl}_2$'], 2, 'Nitrogen atoms share three pairs of electrons.', 'medium', 'Covalent bonding'),
            tf('A covalent bond involves the sharing of a pair of electrons.', true, 'Covalent bonds are formed by shared electron pairs.', 'easy', 'Covalent bonding'),
            mc('What is the shape of a water molecule?', ['Linear', 'Bent', 'Trigonal planar', 'Tetrahedral'], 1, 'Two bonding pairs and two lone pairs give a bent shape.', 'medium', 'Molecular shape and polarity'),
            ms('Which of these compounds are ionic? (Select all that apply.)', ['$\\text{MgO}$', '$\\text{KBr}$', '$\\text{CO}_2$', '$\\text{CaCl}_2$'], [0, 1, 3], 'CO₂ is formed from two non-metals sharing electrons.', 'medium', 'Ionic bonding'),
            sa('How many valence electrons does a chlorine atom have? (Number only.)', ['7'], 'Chlorine is in group 17, so it has seven valence electrons.', 'easy', 'Covalent bonding'),
          ],
        },
      },
      { title: 'Stoichiometry and the Mole', minutes: 50, description: 'Moles, molar mass, balanced equations and limiting reagents.', introduction: 'The mole connects the invisible world of atoms to quantities we can weigh in the laboratory.', objectives: ['Convert between mass, moles and particles', 'Use balanced equations to predict amounts'], concepts: ['Mole', 'Molar mass', 'Limiting reagent'], topics: ['The mole concept', 'Balancing equations', 'Limiting reagents and yield'] },
      { title: 'Acids, Bases and Salts', minutes: 40, description: 'pH, strong and weak acids, neutralisation and titration.', introduction: 'Acids and bases are central to chemistry in the laboratory, industry and the human body.', objectives: ['Define acids and bases', 'Calculate pH'], concepts: ['pH', 'Neutralisation', 'Titration'], topics: ['Acid–base theories', 'The pH scale', 'Titration'] },
      { title: 'Electrochemistry', minutes: 45, description: 'Redox reactions, galvanic cells and electrolysis.', introduction: 'Redox reactions transfer electrons, and electrochemical cells turn that flow into usable electricity.', objectives: ['Identify oxidation and reduction', 'Describe a galvanic cell'], concepts: ['Oxidation', 'Reduction', 'Electrode potential'], topics: ['Redox reactions', 'Galvanic cells', 'Electrolysis'] },
    ],
  },
  // ===========================================================================
  {
    slug: 'biology', title: 'Biology', icon: 'dna', color: 'emerald',
    description: 'Cells, genetics, evolution and the human body — clear explanations of the living world. Demo content.',
    units: [
      {
        title: 'Cell Biology', minutes: 40,
        description: 'Cell structure, membrane transport and how cells divide.',
        introduction: 'The cell is the basic unit of life. This unit explores what is inside cells, how substances move across membranes, and how cells divide to grow and reproduce.',
        objectives: ['Compare prokaryotic and eukaryotic cells', 'Describe the functions of major organelles', 'Explain diffusion, osmosis and active transport', 'Outline the stages of mitosis'],
        concepts: ['Organelles', 'Osmosis', 'Mitosis', 'Cell membrane'],
        topics: ['Cell structure', 'Membrane transport', 'Cell division'],
        summary: [
          h2('Cell structure'),
          def('<strong>Cell.</strong> The smallest unit of life that can carry out all life processes.'),
          table(['Organelle', 'Function'], [
            ['Nucleus', 'Stores DNA and controls cell activity'],
            ['Mitochondrion', 'Releases energy from glucose (aerobic respiration)'],
            ['Ribosome', 'Builds proteins'],
            ['Chloroplast', 'Carries out photosynthesis (plant cells)'],
            ['Cell wall', 'Gives support and shape (plant cells)'],
          ]),
          key('<strong>Prokaryotes</strong> (bacteria) have no membrane-bound nucleus. <strong>Eukaryotes</strong> (plants, animals, fungi) do.'),
          h2('Transport across membranes'),
          ul('<strong>Diffusion</strong> — movement of particles from high to low concentration.', '<strong>Osmosis</strong> — diffusion of water across a partially permeable membrane.', '<strong>Active transport</strong> — movement against a concentration gradient using energy (ATP).'),
          example('<strong>Example.</strong> A red blood cell placed in pure water takes in water by osmosis and may burst.'),
          h2('Cell division — mitosis'),
          p('Mitosis produces two genetically identical diploid cells. It is used for growth and repair.'),
          ol('<strong>Prophase</strong> — chromosomes condense.', '<strong>Metaphase</strong> — chromosomes line up at the equator.', '<strong>Anaphase</strong> — sister chromatids are pulled apart.', '<strong>Telophase</strong> — two nuclei form; the cell divides.'),
        ].join(''),
        quiz: {
          title: 'Cell Biology — practice quiz', mode: 'practice', time: null, pass: 60,
          questions: [
            mc('Which organelle is known as the "powerhouse of the cell"?', ['Nucleus', 'Mitochondrion', 'Ribosome', 'Golgi body'], 1, 'Mitochondria release energy from glucose through respiration.', 'easy', 'Cell structure'),
            mc('What is the movement of water across a partially permeable membrane called?', ['Diffusion', 'Active transport', 'Osmosis', 'Filtration'], 2, 'Osmosis is the diffusion of water across a partially permeable membrane.', 'easy', 'Membrane transport'),
            tf('Prokaryotic cells have a membrane-bound nucleus.', false, 'Prokaryotes lack a membrane-bound nucleus; their DNA lies free in the cytoplasm.', 'easy', 'Cell structure'),
            mc('What does mitosis produce?', ['Four genetically different haploid cells', 'Two genetically identical diploid cells', 'Two genetically different haploid cells', 'Four identical haploid cells'], 1, 'Mitosis gives two genetically identical diploid daughter cells.', 'medium', 'Cell division'),
            ms('Which structures are found in plant cells but NOT in animal cells? (Select all that apply.)', ['Chloroplasts', 'Cell wall', 'Large permanent vacuole', 'Mitochondria'], [0, 1, 2], 'Both plant and animal cells contain mitochondria.', 'medium', 'Cell structure'),
            sa('Name the organelle where proteins are made. (One word.)', ['ribosome', 'ribosomes'], 'Ribosomes translate mRNA into proteins.', 'easy', 'Cell structure'),
          ],
        },
      },
      {
        title: 'Genetics and Inheritance', minutes: 45,
        description: 'DNA, genes, Mendel\'s laws and how traits are inherited.',
        introduction: 'Genetics explains why offspring resemble their parents and why they are not identical. We follow information from DNA to traits and predict inheritance with Punnett squares.',
        objectives: ['Describe the structure of DNA', 'Use Punnett squares for monohybrid crosses', 'Explain how mutations arise'],
        concepts: ['Gene', 'Allele', 'Genotype and phenotype', 'Dominant and recessive'],
        topics: ['DNA and genes', 'Mendelian inheritance', 'Mutations'],
        summary: [
          h2('DNA and genes'),
          def('<strong>Gene.</strong> A section of DNA that carries the code for a particular protein or trait.'),
          p('DNA is a double helix. Each nucleotide has a deoxyribose sugar, a phosphate group and one of four bases. Bases pair in a fixed way:'),
          table(['Base', 'Pairs with'], [['Adenine (A)', 'Thymine (T)'], ['Guanine (G)', 'Cytosine (C)']]),
          h2('Mendelian inheritance'),
          ul('<strong>Allele</strong> — a version of a gene.', '<strong>Genotype</strong> — the alleles an organism has (e.g. Aa).', '<strong>Phenotype</strong> — the observable trait.', '<strong>Homozygous</strong> — two identical alleles; <strong>heterozygous</strong> — two different alleles.'),
          example('<strong>Example.</strong> Cross two heterozygous plants (' + m('Aa\\times Aa') + '). Offspring genotypes: ' + m('AA:Aa:aa=1:2:1') + '. With complete dominance the phenotype ratio is <strong>3 dominant : 1 recessive</strong>.'),
          table(['', 'A', 'a'], [['<strong>A</strong>', 'AA', 'Aa'], ['<strong>a</strong>', 'Aa', 'aa']]),
          h2('Mutations'),
          p('A mutation is a change in the DNA sequence. Many are harmless, some are harmful, and a few are beneficial — they are the raw material for evolution.'),
          note('Humans have 46 chromosomes in each body cell (23 pairs).'),
        ].join(''),
        quiz: {
          title: 'Genetics — timed quiz', mode: 'exam', time: 10, pass: 60,
          questions: [
            mc('In a cross of two heterozygous parents ($Aa\\times Aa$) with complete dominance, what is the phenotype ratio?', ['1:1', '3:1', '1:2:1', '9:3:3:1'], 1, 'Three of four offspring show the dominant phenotype.', 'medium', 'Mendelian inheritance'),
            mc('An organism with two identical alleles for a gene is…', ['heterozygous', 'homozygous', 'hemizygous', 'recessive'], 1, 'Homozygous means two identical alleles.', 'easy', 'Mendelian inheritance'),
            tf('A gene is a section of DNA.', true, 'Genes are segments of DNA that code for proteins or functional RNA.', 'easy', 'DNA and genes'),
            mc('In DNA, which base pairs with adenine?', ['Guanine', 'Cytosine', 'Thymine', 'Uracil'], 2, 'A pairs with T; G pairs with C.', 'easy', 'DNA and genes'),
            ms('Which are components of a DNA nucleotide? (Select all that apply.)', ['Deoxyribose sugar', 'Phosphate group', 'Nitrogenous base', 'Amino acid'], [0, 1, 2], 'Amino acids are the building blocks of proteins, not DNA.', 'medium', 'DNA and genes'),
            sa('How many chromosomes are in a normal human body (somatic) cell? (Number only.)', ['46'], 'Humans have 23 pairs of chromosomes.', 'easy', 'DNA and genes'),
          ],
        },
      },
      { title: 'Evolution and Natural Selection', minutes: 35, description: 'Variation, selection pressures and the evidence for evolution.', introduction: 'Evolution explains the diversity of life through variation, inheritance and natural selection.', objectives: ['Explain natural selection', 'Evaluate evidence for evolution'], concepts: ['Variation', 'Selection pressure', 'Adaptation'], topics: ['Variation', 'Natural selection', 'Evidence for evolution'] },
      { title: 'Human Body Systems', minutes: 50, description: 'Digestion, circulation, respiration and coordination.', introduction: 'Organ systems work together to keep the body alive. This unit surveys the main systems and how they cooperate.', objectives: ['Describe the main organ systems', 'Explain how the heart pumps blood'], concepts: ['Circulation', 'Digestion', 'Homeostasis'], topics: ['Digestive system', 'Circulatory system', 'Nervous system'] },
      { title: 'Ecology', minutes: 35, description: 'Ecosystems, food webs, energy flow and human impact.', introduction: 'Ecology studies how organisms interact with each other and their environment.', objectives: ['Construct food chains and webs', 'Explain energy flow and nutrient cycles'], concepts: ['Ecosystem', 'Food web', 'Carbon cycle'], topics: ['Ecosystems', 'Energy flow', 'Human impact'] },
    ],
  },
  // ===========================================================================
  {
    slug: 'english', title: 'English', icon: 'languages', color: 'amber',
    description: 'Reading, grammar, vocabulary and writing skills for confident English at Grade 12. Demo content.',
    units: [
      {
        title: 'Reading Comprehension Strategies', minutes: 30,
        description: 'Find the main idea, make inferences and work out unfamiliar words from context.',
        introduction: 'Strong readers do not just read the words — they actively look for meaning. This unit gives you practical strategies you can use on any passage.',
        objectives: ['Identify the main idea and supporting details', 'Make reasonable inferences from a text', 'Use context to understand new vocabulary'],
        concepts: ['Main idea', 'Inference', 'Context clues', 'Tone'],
        topics: ['Main idea and supporting details', 'Making inferences', 'Vocabulary in context'],
        summary: [
          h2('Before, during and after reading'),
          table(['Stage', 'What to do'], [
            ['Before', 'Preview the title, headings and questions. Predict what the text is about.'],
            ['During', 'Ask questions, underline key ideas, and note unfamiliar words.'],
            ['After', 'Summarise in your own words and check your answers against the text.'],
          ]),
          h2('Main idea and supporting details'),
          def('<strong>Main idea.</strong> The central point the writer wants you to understand. Supporting details are the facts, examples and reasons that back it up.'),
          p('The main idea is often (but not always) stated in the first or last sentence of a paragraph.'),
          h2('Making inferences'),
          def('<strong>Inference.</strong> A conclusion you reach using evidence in the text plus your own reasoning — the writer does not state it directly.'),
          example('<strong>Example.</strong> "Despite the heavy rain, the farmers were delighted. The long drought had finally ended." We can infer that the farmers were <em>relieved</em>, because rain is good news after a drought.'),
          h2('Vocabulary in context'),
          ul('<strong>Definition clue</strong> — the word is explained nearby.', '<strong>Contrast clue</strong> — words like <em>but</em>, <em>however</em> signal an opposite meaning.', '<strong>Example clue</strong> — examples hint at the meaning.'),
          key('Always test your guess: put the meaning in place of the unknown word. Does the sentence still make sense?'),
        ].join(''),
        quiz: {
          title: 'Reading Comprehension — practice quiz', mode: 'practice', time: null, pass: 60,
          questions: [
            mc('Read: "Despite the heavy rain, the farmers were delighted. The long drought had finally ended, and their fields would be green again." What is the main idea?', ['Rain is dangerous for farmers', 'The end of a drought is good news for the farmers', 'Fields are always green', 'The farmers were angry'], 1, 'The passage is about the farmers\' happiness at the end of the drought.', 'easy', 'Main idea and supporting details'),
            mc('In "The teacher gave a concise explanation," the word concise most nearly means…', ['long and detailed', 'brief and clear', 'confusing', 'loud'], 1, 'Concise means expressing a lot in few words.', 'easy', 'Vocabulary in context'),
            tf('An inference is a conclusion based on evidence in the text and reasoning, rather than something stated directly.', true, 'Inferences go beyond what is stated, using clues from the text.', 'easy', 'Making inferences'),
            mc('In the farmers passage, which word best describes how the farmers felt?', ['Relieved and happy', 'Bored', 'Fearful', 'Confused'], 0, 'The end of a drought brings relief and joy.', 'medium', 'Making inferences'),
            ms('Which of these are good reading strategies? (Select all that apply.)', ['Preview the title and headings', 'Ask questions while reading', 'Never think about unfamiliar words', 'Summarise each paragraph'], [0, 1, 3], 'Good readers think actively about unfamiliar words rather than ignoring them.', 'easy', 'Main idea and supporting details'),
            sa('Write one word that means the same as "enormous".', ['huge', 'giant', 'gigantic', 'massive', 'vast', 'immense', 'large', 'colossal'], 'Any close synonym is accepted, for example huge, giant or massive.', 'easy', 'Vocabulary in context'),
          ],
        },
      },
      {
        title: 'Grammar: Tenses and Sentence Structure', minutes: 40,
        description: 'Simple and perfect tenses, subject–verb agreement and conditional sentences.',
        introduction: 'Accurate grammar makes your meaning clear. This unit revises the tenses you need most and the rules that stop the most common mistakes.',
        objectives: ['Choose the correct tense for a situation', 'Make subjects and verbs agree', 'Form and use first and second conditionals'],
        concepts: ['Present perfect', 'Past perfect', 'Subject–verb agreement', 'Conditionals'],
        topics: ['Simple and perfect tenses', 'Subject–verb agreement', 'Conditional sentences'],
        summary: [
          h2('Tenses at a glance'),
          table(['Tense', 'Form', 'Example'], [
            ['Present simple', 'verb (+s)', 'She <strong>goes</strong> to school every day.'],
            ['Present perfect', 'have/has + past participle', 'I <strong>have finished</strong> my homework.'],
            ['Past simple', 'verb + ed / irregular', 'They <strong>went</strong> to the market.'],
            ['Past perfect', 'had + past participle', 'The film <strong>had started</strong> before we arrived.'],
          ]),
          key('Use the <strong>past perfect</strong> for the earlier of two past events: <em>By the time we arrived, the film had started.</em>'),
          h2('Subject–verb agreement'),
          p('The verb must agree with its <strong>subject</strong>, not with the nearest noun.'),
          ul('<em>The list of items <strong>is</strong> on the desk.</em> (subject: list)', '<em>Neither of the boys <strong>was</strong> late.</em> (subject: neither)', '<em>The students and their teacher <strong>are</strong> ready.</em> (compound subject)'),
          h2('Conditional sentences'),
          table(['Type', 'Structure', 'Use'], [
            ['First', 'If + present simple, will + verb', 'Real, possible future'],
            ['Second', 'If + past simple, would + verb', 'Unlikely or imaginary'],
          ]),
          example('<strong>Example.</strong> If it rains tomorrow, we <strong>will cancel</strong> the match. (first conditional)'),
          warn('Do not use <em>will</em> in the <em>if</em>-clause: ✗ <em>If it will rain…</em> ✓ <em>If it rains…</em>'),
        ].join(''),
        quiz: {
          title: 'Grammar — timed quiz', mode: 'exam', time: 10, pass: 60,
          questions: [
            mc('Choose the correct form: "She ___ to school every day."', ['go', 'goes', 'going', 'gone'], 1, 'Third person singular present simple takes -s/-es.', 'easy', 'Simple and perfect tenses'),
            mc('Choose the correct form: "By the time we arrived, the film ___."', ['starts', 'has started', 'had started', 'was start'], 2, 'The film started before we arrived, so use the past perfect.', 'medium', 'Simple and perfect tenses'),
            tf('The sentence "The list of items are on the desk" is grammatically correct.', false, 'The subject is "list" (singular), so the verb should be "is".', 'medium', 'Subject–verb agreement'),
            mc('Choose the correct form: "If it rains tomorrow, we ___ the match."', ['would cancel', 'will cancel', 'cancelled', 'had cancelled'], 1, 'This is a first conditional: if + present simple, will + verb.', 'medium', 'Conditional sentences'),
            ms('Which sentences are in the present perfect? (Select all that apply.)', ['I have finished my homework.', 'She has lived here since 2020.', 'They went to the market.', 'He has been to Addis Ababa twice.'], [0, 1, 3], '"They went to the market" is past simple.', 'medium', 'Simple and perfect tenses'),
            sa('Complete the sentence with one word: "Neither of the boys ___ late."', ['was', 'is'], 'Neither takes a singular verb: was (past) or is (present).', 'medium', 'Subject–verb agreement'),
          ],
        },
      },
      { title: 'Vocabulary and Word Formation', minutes: 30, description: 'Prefixes, suffixes, word families and collocations.', introduction: 'A wide vocabulary helps you read faster and write more precisely. Learn how words are built and you can understand many new ones.', objectives: ['Use common prefixes and suffixes', 'Build word families'], concepts: ['Prefix', 'Suffix', 'Collocation'], topics: ['Prefixes and suffixes', 'Word families', 'Collocations'] },
      { title: 'Essay Writing', minutes: 45, description: 'Plan, draft and revise clear, well-organised essays.', introduction: 'A good essay has a clear argument, logical paragraphs and a strong conclusion. This unit teaches a repeatable process.', objectives: ['Plan an essay', 'Write topic sentences and paragraphs'], concepts: ['Thesis', 'Topic sentence', 'Cohesion'], topics: ['Planning', 'Paragraphs and topic sentences', 'Introductions and conclusions'] },
      { title: 'Punctuation and Mechanics', minutes: 25, description: 'Commas, apostrophes, colons and capital letters.', introduction: 'Punctuation guides the reader through your sentences. Small marks can change meaning completely.', objectives: ['Use commas correctly', 'Use apostrophes for possession and contraction'], concepts: ['Comma', 'Apostrophe', 'Colon and semicolon'], topics: ['Commas', 'Apostrophes', 'Colons and semicolons'] },
    ],
  },
];

// Exams: pools are built from questions at start time.
export const exams = [
  { title: 'Mathematics — mock exam', kind: 'mock', subject: 'mathematics', count: 10, minutes: 15, pass: 50, description: 'A mixed mock exam drawing random questions from the whole subject. Demo content.' },
  { title: 'Physics — mock exam', kind: 'mock', subject: 'physics', count: 10, minutes: 15, pass: 50, description: 'A mixed mock exam drawing random questions from the whole subject. Demo content.' },
  { title: 'Chemistry — subject exam', kind: 'subject', subject: 'chemistry', count: 10, minutes: 15, pass: 50, description: 'Random questions across all chemistry units. Demo content.' },
  { title: 'Biology — subject exam', kind: 'subject', subject: 'biology', count: 10, minutes: 15, pass: 50, description: 'Random questions across all biology units. Demo content.' },
  { title: 'English — subject exam', kind: 'subject', subject: 'english', count: 10, minutes: 15, pass: 50, description: 'Random questions across all English units. Demo content.' },
  { title: 'Functions and Graphs — unit test', kind: 'unit', subject: 'mathematics', units: [['mathematics', 0]], count: 6, minutes: 8, pass: 60, description: 'A short timed test on Unit 1. Demo content.' },
  { title: 'Science sampler — mixed units', kind: 'mixed', subject: null, units: [['physics', 0], ['chemistry', 0], ['biology', 0]], count: 12, minutes: 15, pass: 50, description: 'A mixed-unit exam drawing from the first unit of Physics, Chemistry and Biology. Demo content.' },
];

export const welcomeNotification = {
  title: 'Welcome to Zetora 👋',
  body: 'The subjects you see right now are demonstration content so you can explore the platform. Your real learning materials will appear here soon.',
  link: '/subjects',
};
