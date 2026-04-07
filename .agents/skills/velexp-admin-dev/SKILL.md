---
name: Velexp-Admin-Development
description: Guidelines and patterns for building new modules in the Velexp Admin dashboard.
---

# Velexp-Admin-Development Skill

This skill documents the established development patterns and core utilities of the **Velexp Admin** dashboard to ensure consistency in future development.

## Core Utilities

### Date Management
Always use the `YMD_DateFormate` helper located in `src/helpers/YMD_DateFormate.js`.
- **UI Display**: Use `DD/mm/yyyy` for display.
- **API Payloads**: Ensure the underlying payload sends `yyyy-mm-dd`.
- **Common Usage**:
  ```javascript
  import YMD_DateFormate from "../../helpers/YMD_DateFormate";
  const { from_date, to_date } = YMD_DateFormate(selectedRange);
  ```

### API Integration
Use the custom hooks `useGetApiCall` and `usePostApiCall` located in `src/hooks/`.
- **GET**:
  ```javascript
  const { apifunc: getSomething, data, loading } = useGetApiCall();
  useEffect(() => { getSomething(API_ENDPOINT); }, []);
  ```
- **POST**:
  ```javascript
  const { apifunc: postSomething, loading: actionLoading } = usePostApiCall();
  const response = await postSomething(API_ENDPOINT, payload);
  ```

## UI Components & Patterns

### Standard Headers & Containers
All pages should use `MainHeaderComp` and `TableContainer`.
- **Header**:
  ```javascript
  import MainHeaderComp from "../../components/MainHeaderCom";
  <MainHeaderComp title="Page Title" />
  ```
- **Table**:
  ```javascript
  import TableContainer from "../../components/Table/TableContainer";
  <TableContainer columns={columns} data={data} isGlobalFilter={true} isPagination={true} />
  ```

### Reusable Date Filter
Use the `DateRangeInput` component for all date filters.
- **Usage**:
  ```javascript
  import DateRangeInput from "../../components/Common/DateRangeInput";
  <DateRangeInput value={selectedRange} onChange={setSelectedRange} isBorder={true} />
  ```

### Specialized Modals (e.g. COD Details)
Follow the design established in `CODRejectModal.jsx`. 
- **Style**: Custom header with a red "X" close button, info grid for details, and a clear call-to-action button (red for high-impact actions like "Request Adjustment").

## Configuration

### Routes & Sidebar
- **Routes**: Always use `lazy` loading in `src/routes/index.jsx`.
- **Sidebar**: Add new links in `src/components/VerticalLayout/SidebarContent.jsx`, typically after their logical parent (e.g., COD Reconciliation after RTO Approval). Always wrap in permission checks (`isAdmin`, etc.).

### API Endpoints
Centralize all endpoints in `src/api/index.js` using the `${BASE_URL}` prefix.

## React Optimization Skills

### Memoization
- **useMemo**: Use for expensive data transformations before rendering (e.g. formatting table results).
- **useCallback**: Use for callback functions passed to memoized children to prevent unnecessary re-renders.
- **React.memo**: Wrap display-only components that receive complex props to skip re-rendering if props haven't changed.

### Performance Best Practices
- **Lazy Loading**: All auth-protected routes must be lazy-loaded in `src/routes/index.jsx`.
- **Unique Keys**: Always use stable, unique IDs (e.g. `awbno` or `id`) for keys in lists. Avoid using Array indices.
- **Dependency Arrays**: ensure `useEffect` and `useMemo` dependency arrays are complete but lean.

## Smooth Transition Effects

### Animation Patterns
- **Entrance Animations**: Use the `animate__animated animate__fadeIn` utility classes for main content containers and cards to give a premium feel.
- **Interactive Feedback**: Apply smooth CSS transitions (`transition: all 0.3s ease;`) to hover states and button interactions.
- **Modal Transitions**: Use standard bootstrap `fade` transitions or custom CSS animations for specialized modals (like COD Reject).
