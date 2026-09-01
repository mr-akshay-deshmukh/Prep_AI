export const FLASHCARDS = [
  {
    category: 'React',
    question: 'What is the difference between state and props?',
    answer: 'Props (short for properties) are used to pass data from parent to child components and are immutable. State is used to manage data within a component and can be changed using the setState function (or useState hook).'
  },
  {
    category: 'JavaScript',
    question: 'Explain event delegation in JavaScript.',
    answer: 'Event delegation is a technique where a single event listener is attached to a parent element to manage events for all of its children, taking advantage of event bubbling. This is more memory-efficient than attaching listeners to every child.'
  },
  {
    category: 'System Design',
    question: 'What is a load balancer?',
    answer: 'A load balancer distributes incoming network traffic across multiple servers. This ensures no single server bears too much demand, improving responsiveness and availability of applications.'
  },
  {
    category: 'Data Structures',
    question: 'What is a Hash Table and how does it work?',
    answer: 'A hash table is a data structure that implements an associative array, a structure that can map keys to values. It uses a hash function to compute an index into an array of buckets or slots, from which the desired value can be found.'
  },
  {
    category: 'Behavioral',
    question: 'Tell me about a time you had a conflict with a coworker.',
    answer: 'Use the STAR method (Situation, Task, Action, Result). Focus on the constructive actions you took to resolve the conflict professionally, emphasizing communication, empathy, and the positive outcome.'
  }
];
