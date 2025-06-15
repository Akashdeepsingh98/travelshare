import { Post, User } from './types';

export const samplePosts: Post[] = [
  {
    id: 'post-1',
    userId: 'user-2',
    userName: 'Sarah Johnson',
    userAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    location: 'Santorini, Greece',
    content: 'Just watched the most incredible sunset from Oia! The blue domes and white buildings create such a magical atmosphere. This place truly lives up to all the hype! 🌅',
    imageUrl: 'https://images.pexels.com/photos/161815/santorini-oia-greece-water-161815.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: new Date('2024-01-15T18:30:00'),
    likes: ['user-3', 'user-4'],
    comments: [
      {
        id: 'comment-1',
        userId: 'user-3',
        userName: 'Mike Rodriguez',
        userAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        content: 'Absolutely stunning! Santorini is on my bucket list.',
        timestamp: new Date('2024-01-15T19:00:00')
      }
    ]
  },
  {
    id: 'post-2',
    userId: 'user-3',
    userName: 'Mike Rodriguez',
    userAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    location: 'Kyoto, Japan',
    content: 'Early morning walk through the bamboo forest in Arashiyama. The way the light filters through the bamboo creates such a peaceful, almost otherworldly experience. 🎋',
    imageUrl: 'https://images.pexels.com/photos/161401/fushimi-inari-taisha-shrine-kyoto-japan-temple-161401.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: new Date('2024-01-14T08:15:00'),
    likes: ['user-1', 'user-2'],
    comments: []
  },
  {
    id: 'post-3',
    userId: 'user-4',
    userName: 'Emma Thompson',
    userAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    location: 'Machu Picchu, Peru',
    content: 'After a challenging 4-day trek on the Inca Trail, finally reaching Machu Picchu at sunrise was absolutely breathtaking. The ancient citadel emerging from the morning mist is something I\'ll never forget! 🏔️',
    imageUrl: 'https://images.pexels.com/photos/259967/pexels-photo-259967.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: new Date('2024-01-13T06:45:00'),
    likes: ['user-1'],
    comments: [
      {
        id: 'comment-2',
        userId: 'user-1',
        userName: 'Alex Chen',
        userAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        content: 'Incredible achievement! The Inca Trail is no joke.',
        timestamp: new Date('2024-01-13T10:30:00')
      }
    ]
  }
];