# LostDevice - Device Recovery Platform
<!-- v2 -->

A modern web application for reporting and finding lost devices. Built with React, TypeScript, and Supabase.

## Features

- Report lost devices with detailed information
- Search for found devices
- Real-time messaging between users
- User authentication and profiles
- Responsive design for all devices

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **Routing**: React Router
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd retrieve-it-main-3
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Add your Supabase credentials to the `.env` file.

4. Start the development server:
```bash
npm run dev
```

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

**Puneet Kumar Garg**
- LinkedIn: [puneet-kumar-garg](https://www.linkedin.com/in/puneet-kumar-garg/)
- GitHub: [puneet-kumar-garg](https://github.com/puneet-kumar-garg/)
## Changelog
- v1.0.0: Initial release
- v1.0.2: Bug fixes and improvements
- v1.0.5: Performance improvements
