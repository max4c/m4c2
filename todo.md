# Blog Aesthetics Iteration - Progress Tracker

## Project Overview
This file tracks the implementation progress of iterating on the blog aesthetics for maxforsey.com.

**IMPORTANT: Update this file whenever a milestone is completed**

## Reference Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MDX Documentation](https://mdxjs.com/)

## Implementation Milestones

### Milestone 1: Blog Series Page (`/blog/series`)
#### Implementation Tasks
1.1 [x] Make the "Back to blog" link left-aligned.

#### Testing Tasks
1.2 [ ] Verify the "Back to blog" link is visually left-aligned on the page.

### Milestone 2: Blog Post Page (`/blog/[slug]`)
#### Implementation Tasks
2.1 [x] Create a simple `SubscribeInput` component (`src/components/SubscribeInput.tsx`).
2.2 [x] Replace the existing `SubscribeButton` modal with the `SubscribeInput` component at the bottom of the page.
2.3 [x] Ensure the `SubscribeInput` component and the "Back to blog" link are left-aligned.
2.4 [x] Delete the unused `SubscribeButton` component (`src/components/SubscribeButton.tsx`).
2.5 [x] Remove date/location/subscribe button display from `BlogPostHeader.tsx`.
2.6 [x] Moved post date display to the bottom of the page, ordered: Date, Link, Subscribe. Formatted date as MM/dd/yyyy. Removed read time.
2.7 [x] Add banner graphic (`next/image`) to `BlogPostHeader.tsx` between header nav and title. Set src to `/images/blog-banners/banner.png` and aspect ratio to 2:1 (1200x600).

#### Testing Tasks
2.8 [ ] Verify the subscribe input appears correctly at the bottom, left-aligned.
2.9 [ ] Verify the "Back to blog" link is present and left-aligned below the subscribe input.
2.10 [x] Verify the date appears correctly below the "back to blog" link, left-aligned, in MM/dd/yyyy format.
2.11 [x] Verify the old subscribe button/modal is gone.
2.12 [x] Verify the date and location are no longer displayed in the header.
2.13 [x] Verify the banner graphic appears correctly between header nav and title, with correct source and aspect ratio.

### Milestone 3: Home Page (`/`)
#### Implementation Tasks
3.1 [x] Add the `SubscribeInput` component below the main paragraph.
3.2 [x] Add text links (email, git, x, in) to the right of the subscribe input, on the same line.
3.3 [x] Match social link text size to header nav links (base size).
3.4 [x] Adjust vertical spacing around intro paragraph for symmetry.

#### Testing Tasks
3.5 [ ] Verify the subscribe input appears correctly on the home page.
3.6 [ ] Verify the text links appear correctly to the right of the subscribe input and link correctly.
3.7 [ ] Verify social link text size matches header nav link size.
3.8 [ ] Verify vertical spacing above/below intro paragraph is symmetrical.

### Milestone 4: Blog Post Graphics Setup
#### Implementation Tasks
4.1 [x] Create a directory structure: `public/images/blog-banners/`.
4.2 [ ] Add a placeholder image (`placeholder.png`) to the directory.

#### Testing Tasks
4.3 [x] Verify the directory structure exists.
4.4 [ ] Verify the placeholder image exists in the directory.

### Milestone 5: Subscription Handling
#### Implementation Tasks
5.1 [x] Implement API call in `SubscribeInput.tsx` to `/api/subscribe`.
5.2 [x] Add loading state to `SubscribeInput`.
5.3 [x] Display status messages (loading, success, error) next to the button in `SubscribeInput`, replacing the old placeholder/alert.

#### Testing Tasks
5.4 [ ] Test successful subscription: Enter valid email, click subscribe, verify 'Subscribed!' message appears, verify input clears, verify minimal welcome email received.
5.5 [ ] Test duplicate subscription: Enter same email again, click subscribe, verify 'already subscribed' message appears.
5.6 [ ] Test invalid email: Enter invalid email format, click subscribe, verify error message appears.
5.7 [ ] Test API error: Simulate server error, verify generic error message appears.
5.8 [ ] Simplify welcome email HTML in `/api/subscribe` route.

## Implementation Locations
- [x] `src/app/blog/series/page.tsx`
- [x] `src/app/blog/[slug]/page.tsx`
- [x] `src/app/page.tsx`
- [x] `src/components/BlogPostHeader.tsx`
- [x] `src/components/SubscribeInput.tsx`
- [ ] `public/images/blog-banners/` (To be created)

## Technical Considerations
- Ensure responsiveness of the new components and layout changes.
- Actual email subscription logic needs to be implemented for `SubscribeInput.tsx` (currently placeholder).
- Banner graphics should be optimized for web use (size, format).
- Requires `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` environment variables to be set for `/api/subscribe` to function correctly.

## Notes on Progress
- Completed alignment change on series page.
- Completed replacement of subscribe modal with input box on post pages.
- Completed date/read time relocation on post pages.
- Completed header cleanup on post pages.
- Completed addition of subscribe input and social links on the home page (using text links).
- Completed refinement of blog post bottom section (order, date format, subscribe size).
- Moved banner image from blog post page to BlogPostHeader.
- Updated banner source and aspect ratio.
- Resolved theme switching issue (cleared localStorage).
- Adjusted home page social link size and intro paragraph spacing.
- Reordered elements in blog post footer.
- Implemented Resend API call and status feedback in SubscribeInput component.
- Simplified Resend welcome email HTML.

Last Updated: 2024-07-26 