import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Typography, useTheme, alpha } from '@mui/material';

// Test markdown content
const testMarkdown = `# Financial Advice from Capy

Hello! I'm **Capy**, your friendly financial assistant. Here's some advice:

## Budgeting Tips

Here are *three key strategies* for managing your finances:

1. **Track your expenses** using the CapySpend app
2. Set up an *emergency fund* with \`$1000\` as a starter goal
3. Review your spending **weekly** to stay on track

### Important Reminders

> Remember: A good emergency fund should cover 3-6 months of expenses

### Quick Money-Saving Tips

- Reduce dining out budget by \`$50\` per month  
- Use **cashback credit cards** for regular purchases
- Set up *automatic savings* transfers

\`\`\`
Monthly Budget Example:
Income: $4000
Fixed Expenses: $2500
Variable Expenses: $1000
Savings: $500
\`\`\`

For more detailed financial planning, feel free to ask me specific questions about your spending patterns!`;

const MarkdownTest: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Markdown Rendering Test
      </Typography>
      
      <Box
        className="markdown-content"
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <Typography variant="body1" component="div" sx={{ mb: 1 }}>
                {children}
              </Typography>
            ),
            h1: ({ children }) => (
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
                {children}
              </Typography>
            ),
            h2: ({ children }) => (
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1.5, color: theme.palette.primary.main }}>
                {children}
              </Typography>
            ),
            h3: ({ children }) => (
              <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
                {children}
              </Typography>
            ),
            strong: ({ children }) => (
              <Typography component="strong" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {children}
              </Typography>
            ),
            em: ({ children }) => (
              <Typography component="em" sx={{ fontStyle: 'italic', color: theme.palette.secondary.main }}>
                {children}
              </Typography>
            ),
            code: ({ children }) => (
              <Typography 
                component="code" 
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  padding: '2px 6px',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  fontWeight: 'bold'
                }}
              >
                {children}
              </Typography>
            ),
            pre: ({ children }) => (
              <Box
                component="pre"
                sx={{
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                  padding: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  my: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                }}
              >
                {children}
              </Box>
            ),
            ul: ({ children }) => (
              <Box component="ul" sx={{ pl: 3, my: 1 }}>
                {children}
              </Box>
            ),
            ol: ({ children }) => (
              <Box component="ol" sx={{ pl: 3, my: 1 }}>
                {children}
              </Box>
            ),
            li: ({ children }) => (
              <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
                {children}
              </Typography>
            ),
            blockquote: ({ children }) => (
              <Box
                component="blockquote"
                sx={{
                  borderLeft: `4px solid ${theme.palette.warning.main}`,
                  paddingLeft: 2,
                  margin: '1em 0',
                  fontStyle: 'italic',
                  color: theme.palette.warning.dark,
                  backgroundColor: alpha(theme.palette.warning.main, 0.05),
                  padding: 2,
                  borderRadius: '0 4px 4px 0'
                }}
              >
                {children}
              </Box>
            )
          }}
        >
          {testMarkdown}
        </ReactMarkdown>
      </Box>
    </Box>
  );
};

export default MarkdownTest;
