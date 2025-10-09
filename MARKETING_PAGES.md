# Marketing Pages Integration Guide

## Overview
The marketing website has been successfully integrated into your React application. The marketing pages serve as the public-facing website, while the application dashboard is protected behind authentication.

## URL Structure

### Public Marketing Pages (No Login Required)
- **Home**: `http://localhost:3000/` - Landing page with hero section
- **Features**: `http://localhost:3000/features` - Detailed feature descriptions
- **Pricing**: `http://localhost:3000/pricing` - Pricing tiers and FAQs
- **About**: `http://localhost:3000/about` - Company story and team
- **Contact**: `http://localhost:3000/contact` - Contact form
- **Support**: `http://localhost:3000/support` - Help center
- **Compliance**: `http://localhost:3000/compliance` - Compliance information

### Protected Application Routes (Login Required)
- **Dashboard**: `http://localhost:3000/app` - Main application dashboard
- **All app features**: `http://localhost:3000/app/*` - Fee management, clients, etc.

### Authentication Routes
- **Login**: `http://localhost:3000/login` - Dedicated login page
- **Auth Callback**: `http://localhost:3000/auth/callback` - OAuth callback

## How It Works

### User Flow

1. **First-time Visitor**:
   - Lands on marketing home page (`/`)
   - Can browse all marketing pages
   - Clicks "Login" button in navigation
   - Login modal appears with email/password and Google Sign-in options
   - After login, redirects to `/app` (dashboard)

2. **Logged-in User**:
   - Navigation shows user initials in a circle instead of "Login" button
   - Clicking user circle redirects to `/app` (dashboard)
   - Can still access marketing pages while logged in

3. **Direct App Access**:
   - Visiting `/app` when not logged in redirects to `/login`
   - After login, returns to requested page

## Components

### Shared Components (in `src/public-pages/components/`)
- **MarketingLayout.tsx**: Wrapper component with header, footer, and login modal
- **MarketingHeader.tsx**: Navigation bar with logo, menu links, and login button/user circle
- **MarketingFooter.tsx**: Footer with company info and navigation links
- **LoginModal.tsx**: Login form with Supabase authentication

### Pages (in `src/public-pages/pages/`)
- **HomePage.tsx**: Landing page
- **FeaturesPage.tsx**: Features overview
- **PricingPage.tsx**: Pricing plans
- **AboutPage.tsx**: About us and team
- **ContactPage.tsx**: Contact form
- **SupportPage.tsx**: Help center
- **CompliancePage.tsx**: Compliance information

### Styling
- **marketing.css**: All marketing page styles (responsive, modern design)

## Starting the Application

```bash
# Development mode
npm start

# Production build
npm run build

# Serve production build
npm install -g serve
serve -s build
```

Then visit:
- Marketing site: `http://localhost:3000/`
- Application: `http://localhost:3000/app` (requires login)

## Customization

### Update Company Information
Edit `src/public-pages/components/MarketingFooter.tsx`:
```tsx
<p>123 Business St</p>        // Change address
<p>City, State, Zip</p>       // Change city/state
<p>(123) 456-7890</p>         // Change phone
<p><a href="mailto:...">...</a></p>  // Change email
```

### Update Branding
Edit `src/public-pages/styles/marketing.css`:
```css
:root {
    --primary: #2563eb;      /* Main brand color */
    --accent: #0ea5e9;       /* Accent color */
    --background: #f8fafc;   /* Background color */
}
```

### Update Team Information
Edit `src/public-pages/pages/AboutPage.tsx` to update team member details and photos.

### Update Pricing
Edit `src/public-pages/pages/PricingPage.tsx` to modify pricing tiers, features, and amounts.

## Authentication Integration

The marketing pages are fully integrated with your existing Supabase authentication:

- **Login Modal** uses `supabase.auth.signInWithPassword()`
- **Google Sign-in** uses `supabase.auth.signInWithOAuth()`
- **User State** checked via `supabase.auth.getUser()`
- **Auth Events** subscribed via `supabase.auth.onAuthStateChange()`

## Navigation Between Marketing and App

### From Marketing to App:
1. User clicks "Login" → Login modal appears
2. User authenticates → Redirected to `/app`
3. OR: Logged-in user clicks their initials circle → Goes to `/app`

### From App to Marketing:
- Add a link in your app navigation to return to marketing pages if needed
- User can type marketing URLs directly

## Features

✅ Responsive design (mobile-friendly)
✅ Modern styling with blue gradient theme
✅ Integrated authentication with Supabase
✅ User state management (shows initials when logged in)
✅ Smooth transitions between marketing and app
✅ SEO-friendly structure
✅ Contact forms and support pages
✅ Pricing tables and feature cards
✅ Team profiles and company info

## Deployment Considerations

When deploying to production:

1. Update the OAuth redirect URL in your Supabase project settings
2. Update any hardcoded URLs (localhost → production domain)
3. Configure proper routing on your hosting platform (single-page app routing)
4. Consider SEO optimization (meta tags, sitemap, robots.txt)
5. Update company contact information

## File Structure

```
src/
├── public-pages/
│   ├── components/
│   │   ├── MarketingHeader.tsx
│   │   ├── MarketingFooter.tsx
│   │   ├── LoginModal.tsx
│   │   └── MarketingLayout.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── FeaturesPage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── SupportPage.tsx
│   │   ├── CompliancePage.tsx
│   │   └── index.ts
│   └── styles/
│       └── marketing.css
└── App.tsx (routing configuration)
```

## Troubleshooting

### Issue: Marketing pages not loading
- Check that `npm start` is running
- Verify routes in `App.tsx` are configured correctly
- Check browser console for errors

### Issue: Login not working
- Verify Supabase credentials in `.env` file
- Check Supabase dashboard for authentication settings
- Ensure OAuth providers are enabled (if using Google Sign-in)

### Issue: Styles not applying
- Ensure `marketing.css` is imported in components
- Check for CSS conflicts with existing styles
- Clear browser cache and rebuild

### Issue: User circle not showing
- Check that user profile exists in `user_profiles` table
- Verify Supabase permissions for reading user data
- Check browser console for errors

## Next Steps

Consider adding:
- Privacy Policy and Terms of Service pages
- Blog/News section
- Customer testimonials with real data
- Integration demos/screenshots
- Live chat widget
- Newsletter signup functionality
- Social media links
