import React from "react";
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme, alpha } from "@mui/material";

interface TransactionTableCardProps {
  markdownTable: string;
}

// Helper to parse markdown table into rows
function parseMarkdownTable(markdown: string): string[][] {
  const lines = markdown.trim().split("\n").filter(line => line.trim().startsWith("|"));
  return lines.map(line =>
    line
      .split("|")
      .slice(1, -1)
      .map(cell => cell.trim())
  );
}

const TransactionTableCard: React.FC<TransactionTableCardProps> = ({ markdownTable }) => {
  const theme = useTheme();
  const rows = parseMarkdownTable(markdownTable);
  if (rows.length < 2) return null; // Need at least header + one row
  let [header, ...body] = rows;

  // Find the index of the 'Category' column (case-insensitive)
  const categoryIndex = header.findIndex(
    (col) => col.trim().toLowerCase() === 'category'
  );
  // Remove the 'Category' column from header and all rows
  if (categoryIndex !== -1) {
    header = header.filter((_, i) => i !== categoryIndex);
    body = body.map(row => row.filter((_, i) => i !== categoryIndex));
  }

  // Remove the markdown separator row (all dashes)
  body = body.filter(row => !row.every(cell => /^-+$/.test(cell)));

  // Flip the sign of the Amount column (assume it's the second column)
  const flipAmount = (amount: string) => {
    // Remove $ and commas for parsing
    const clean = amount.replace(/[$,]/g, '').trim();
    if (/^\-/.test(clean)) {
      // If negative, make positive
      const val = Math.abs(parseFloat(clean));
      return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } else if (/^\+/.test(clean)) {
      // If positive, make negative
      const val = -Math.abs(parseFloat(clean));
      return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } else {
      // If no sign, just return as is
      return amount;
    }
  };

  return (
    <Card
      elevation={2}
      sx={{
        mt: 2,
        borderRadius: 2,
        background: alpha(theme.palette.info.main, 0.05),
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        maxWidth: 600,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} color="info.main" sx={{ mb: 2 }}>
          Transactions
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {header.map((col, i) => (
                  <TableCell key={i} sx={{ fontWeight: 600 }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {body.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>
                      {j === 1 ? flipAmount(cell) : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TransactionTableCard; 