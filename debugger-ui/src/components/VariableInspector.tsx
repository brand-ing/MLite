import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";

interface Variable {
  name: string;
  type: string;
  value: any;
}

interface VariableInspectorProps {
  variables: Variable[];
}

const VariableInspector: React.FC<VariableInspectorProps> = ({ variables }) => {
  return (
    <Box sx={{ padding: "16px" }}>
      <Typography variant="h6" gutterBottom>
        Variable Inspector
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Type</strong>
              </TableCell>
              <TableCell>
                <strong>Value</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variables.map((variable, index) => (
              <TableRow key={index}>
                <TableCell>{variable.name}</TableCell>
                <TableCell>{variable.type}</TableCell>
                <TableCell>{JSON.stringify(variable.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VariableInspector;
