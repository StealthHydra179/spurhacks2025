const userDb = require('./db/users');
const { logger } = require('./logger');

async function testPersonalityFunctions() {
  try {
    console.log('Testing personality functions (using integer mode field)...');
    
    // Test data - integer personality modes
    const testUserId = 1; // Assuming user with ID 1 exists
    const testPersonalities = [
      { mode: 0, description: 'normal' },
      { mode: -1, description: 'less aggressive' },
      { mode: 1, description: 'more aggressive' }
    ];

    for (const test of testPersonalities) {
      console.log(`\nTesting personality mode ${test.mode} (${test.description}):`);
      
      // Test setting personality
      console.log(`Setting personality mode ${test.mode} for user ID: ${testUserId}`);
      await userDb.setUserPersonality(testUserId, test.mode);
      console.log('✓ Personality mode set successfully');

      // Test getting personality
      console.log(`Getting personality mode for user ID: ${testUserId}`);
      const retrievedPersonality = await userDb.getUserPersonality(testUserId);
      console.log('✓ Personality mode retrieved successfully');
      console.log(`Retrieved personality mode: ${retrievedPersonality} (${test.description})`);

      // Verify the data matches
      if (test.mode === retrievedPersonality) {
        console.log('✓ Personality mode matches what was set');
      } else {
        console.log('✗ Personality mode does not match');
      }
    }

    // Test getting personality for non-existent user
    console.log('Testing with non-existent user ID: 99999');
    const nonExistentPersonality = await userDb.getUserPersonality(99999);
    if (nonExistentPersonality === null) {
      console.log('✓ Correctly returned null for non-existent user');
    } else {
      console.log('✗ Expected null for non-existent user');
    }

    console.log('\nAll personality function tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing personality functions:', error);
  }
}

// Run the test
testPersonalityFunctions();
