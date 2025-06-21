# User Personality API Documentation

This document describes the personality functionality that uses the existing `mode` field in the user management system.

## Database Schema

The existing `mode` column in the `users` table is used to store personality data:
- **Type**: INTEGER
- **Values**:
  - `0` = normal
  - `-1` = less aggressive
  - `1` = more aggressive

## Database Functions

### `setUserPersonality(userId, personalityMode)`
- **Purpose**: Update a user's personality mode in the `mode` field
- **Parameters**:
  - `userId` (integer): The user's ID
  - `personalityMode` (integer): Personality mode (-1, 0, or 1)
- **Returns**: SQL result

### `getUserPersonality(userId)`
- **Purpose**: Retrieve a user's personality mode from the `mode` field
- **Parameters**:
  - `userId` (integer): The user's ID
- **Returns**: 
  - Integer personality mode (-1, 0, or 1) if found
  - `null` if user doesn't exist

## API Endpoints

### POST `/api/users/personality`
- **Purpose**: Set/update the authenticated user's personality mode
- **Authentication**: Required (JWT token in cookie)
- **Request Body**:
  ```json
  {
    "personality": 0
  }
  ```
  Where personality can be:
  - `-1`: less aggressive
  - `0`: normal  
  - `1`: more aggressive

- **Response Success (200)**:
  ```json
  {
    "message": "Personality updated successfully",
    "personality": 0,
    "status": "success"
  }
  ```
- **Response Error (400)**:
  ```json
  {
    "message": "Invalid personality mode. Must be -1 (less aggressive), 0 (normal), or 1 (more aggressive)"
  }
  ```

### GET `/api/users/personality`
- **Purpose**: Get the authenticated user's personality mode
- **Authentication**: Required (JWT token in cookie)
- **Response Success (200)**:
  ```json
  {
    "personality": 0,
    "personality_description": "normal",
    "status": "success"
  }
  ```
- **Response Not Found (404)**:
  ```json
  {
    "message": "Personality not found for user",
    "personality": null
  }
  ```

## Usage Examples

### Setting User Personality (Frontend)
```javascript
// Set user personality mode
const setPersonality = async (personalityMode) => {
  // personalityMode should be -1, 0, or 1
  try {
    const response = await fetch('/api/users/personality', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ personality: personalityMode })
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('Personality updated:', result.message);
      console.log('New personality mode:', result.personality);
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Example usage:
// setPersonality(0);  // Set to normal
// setPersonality(-1); // Set to less aggressive
// setPersonality(1);  // Set to more aggressive
```

### Getting User Personality (Frontend)
```javascript
// Get user personality mode
const getPersonality = async () => {
  try {
    const response = await fetch('/api/users/personality', {
      method: 'GET',
      credentials: 'include' // Include cookies for authentication
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('Personality mode:', result.personality);
      console.log('Description:', result.personality_description);
      return result.personality;
    } else {
      console.error('Error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

## Database Migration

No database migration is needed as we're using the existing `mode` column:
```sql
-- No database changes needed - using existing mode column for personality
-- mode is INTEGER: 0 = normal, -1 = less aggressive, 1 = more aggressive
```

The existing `mode` column in the `users` table already supports the personality system.

## Security Notes

- All personality endpoints require authentication via JWT token
- Personality data is stored as JSON and parsed/stringified automatically
- Only the authenticated user can access or modify their own personality data
- Input validation ensures personality data is provided in requests

## Error Handling

The API includes comprehensive error handling:
- 400: Bad Request (missing personality data)
- 401: Unauthorized (missing or invalid token)
- 404: Not Found (user has no personality data)
- 500: Internal Server Error (database or server issues)

All errors are logged for debugging purposes.
