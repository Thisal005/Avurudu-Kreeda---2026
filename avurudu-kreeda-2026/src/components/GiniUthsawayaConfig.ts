export type FirecrackerType = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export const FIRECRACKERS: FirecrackerType[] = [
  { id: 'patas', name: 'Small Patas', price: 50, image: '/firecrackers/One.png' },
  { id: 'flowerpot', name: 'Flower Pot', price: 120, image: '/firecrackers/Two.png' },
  { id: 'chakkaram', name: 'Chakkaram / Wheel', price: 180, image: '/firecrackers/Four.png' },
  { id: 'rocket', name: 'Rocket', price: 250, image: '/firecrackers/Five.png' },
  { id: 'bomb', name: 'Big Bomb', price: 320, image: '/firecrackers/Eight.png' },
  { id: 'mega', name: 'Mega Pack', price: 800, image: '/firecrackers/Three.png' },
  { id: 'Time Bomb', name: 'Time Bomb', price: 1000, image: '/firecrackers/Six.png' },
  { id: 'Nuce', name: 'Nuce', price: 2000, image: '/firecrackers/Seven.png' },
];
