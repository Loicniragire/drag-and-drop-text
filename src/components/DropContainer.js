import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Button,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Typography,
  Grid,
  List,
  ListItem,
  Box,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme, dragover }) => ({
  border: "2px dashed #ccc",
  padding: theme.spacing(3),
  minHeight: "300px",
  backgroundColor: dragover ? "#e0f7fa" : "#f9f9f9",
  borderRadius: theme.shape.borderRadius,
  transition: "background-color 0.3s",
  outline: "none",
  display: "flex",
  flexDirection: "column",
  position: "relative",
}));

const DropContainer = () => {
  const [droppedData, setDroppedData] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [datasetName, setDatasetName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Load data from Local Storage on mount
  useEffect(() => {
    const storedData = localStorage.getItem("droppedData");
    const storedName = localStorage.getItem("datasetName");
    if (storedData) {
      setDroppedData(JSON.parse(storedData));
    }
    if (storedName) {
      setDatasetName(storedName);
    }
  }, []);

  // Save data to Local Storage whenever droppedData or datasetName changes
  useEffect(() => {
    localStorage.setItem("droppedData", JSON.stringify(droppedData));
    localStorage.setItem("datasetName", datasetName);
  }, [droppedData, datasetName]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMessage("");

    const jsonData = e.dataTransfer.getData("application/json");
    const htmlData = e.dataTransfer.getData("text/html");
    const plainText = e.dataTransfer.getData("text/plain");

    let structuredData = [];
    let unstructuredData = [];

    // Parse JSON data
    if (jsonData) {
      try {
        const parsedJson = JSON.parse(jsonData);
        if (Array.isArray(parsedJson)) {
          structuredData = parsedJson.map((item) => ({
            id: uuidv4(),
            key: item.key,
            value: item.value,
          }));
        } else if (typeof parsedJson === "object" && parsedJson !== null) {
          structuredData = [
            {
              id: uuidv4(),
              key: parsedJson.key,
              value: parsedJson.value,
            },
          ];
        }
      } catch (error) {
        console.error("Error parsing JSON data:", error);
        setErrorMessage("Failed to parse JSON data.");
      }
    }

    // Parse HTML data
    if (htmlData) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, "text/html");
      const labels = doc.querySelectorAll("label");

      labels.forEach((label) => {
        const forAttr = label.getAttribute("for");
        if (forAttr) {
          const input = doc.getElementById(forAttr);
          if (input) {
            const key = label.textContent.trim().replace(":", "");
            const value = input.value || input.getAttribute("value") || "";
            if (key && value) {
              structuredData.push({ id: uuidv4(), key, value });
            }
          }
        } else {
          const input = label.querySelector("input");
          if (input) {
            const keyNode = label.childNodes[0];
            const key = keyNode.nodeValue ? keyNode.nodeValue.trim().replace(":", "") : "";
            const value = input.value || input.getAttribute("value") || "";
            if (key && value) {
              structuredData.push({ id: uuidv4(), key, value });
            }
          }
        }
      });
    }

    // Parse plain text data
    if (plainText) {
      const parsedPlainText = extractKeyValuePairsFromText(plainText);
      if (parsedPlainText.length > 0) {
        unstructuredData = parsedPlainText.map((pair) => ({
          id: uuidv4(),
          key: pair.key,
          value: pair.value,
        }));
      }
    }

    const combinedData = [...structuredData, ...unstructuredData];

    if (combinedData.length > 0) {
      setDroppedData((prev) => [...prev, ...combinedData]);
      setSnackbar({ open: true, message: "Data dropped successfully!", severity: "success" });
    } else {
      setErrorMessage("No valid data to drop.");
      setSnackbar({ open: true, message: "No valid data to drop.", severity: "error" });
    }
  };

  const extractKeyValuePairsFromText = (text) => {
    return text
      .split("\n")
      .map((line) => {
        const [key, ...valueParts] = line.split(":").map((s) => s.trim());
        const value = valueParts.join(":");
        return { key, value };
      })
      .filter((pair) => pair.key && pair.value);
  };

  const handleRemove = (idToRemove) => {
    setDroppedData((prev) => prev.filter((item) => item.id !== idToRemove));
    setSnackbar({ open: true, message: "Entry removed.", severity: "info" });
  };

  const handleUpdate = (idToUpdate, field, newValue) => {
    setDroppedData((prev) =>
      prev.map((item) =>
        item.id === idToUpdate ? { ...item, [field]: newValue } : item
      )
    );
  };

  const handleExport = (format) => {
    if (droppedData.length === 0) {
      setErrorMessage("No data available to export.");
      setSnackbar({ open: true, message: "No data available to export.", severity: "error" });
      return;
    }

    if (!datasetName.trim()) {
      setErrorMessage("Please enter a name for your data set before exporting.");
      setSnackbar({ open: true, message: "Please enter a data set name.", severity: "error" });
      return;
    }

    let dataStr = "";
    let mimeType = "";
    let fileName = "";

    if (format === "json") {
      dataStr = JSON.stringify(
        {
          datasetName: datasetName,
          data: droppedData.map(({ id, key, value }) => ({ key, value })),
        },
        null,
        2
      );
      mimeType = "application/json";
      fileName = `${datasetName}.json`;
    } else if (format === "csv") {
      dataStr = `Dataset Name: ${datasetName}\n\nKey,Value\n` +
        droppedData
          .map(
            (pair) =>
              `"${pair.key.replace(/"/g, '""')}","${pair.value.replace(/"/g, '""')}"`
          )
          .join("\n");
      mimeType = "text/csv";
      fileName = `${datasetName}.csv`;
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    setSnackbar({ open: true, message: `Data exported as ${format.toUpperCase()}.`, severity: "success" });
  };

  const handleClearAll = () => {
    setDroppedData([]);
    setDatasetName("");
    setSnackbar({ open: true, message: "All data cleared.", severity: "info" });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <StyledPaper
      dragover={isDragOver ? 1 : 0}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      role="button"
      aria-label="Data Drop Area"
      tabIndex={0}
    >
      <Typography variant="h5" gutterBottom>
        Dropped Data
      </Typography>
      {/* Data Set Name Input */}
      <Grid container spacing={2} sx={{ marginBottom: "20px" }}>
        <Grid item xs={12}>
          <TextField
            label="Data Set Name"
            variant="outlined"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="Enter a name for your data set"
            fullWidth
            aria-label="Data Set Name"
          />
        </Grid>
      </Grid>

      {/* Error Message */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage("")} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Dropped Data List */}
      {droppedData.length === 0 ? (
        <Typography variant="body1" sx={{ color: "#777", textAlign: "center", marginTop: "50px" }}>
          Drag and drop data here.
        </Typography>
      ) : (
        <>
          <List
            sx={{
              width: "100%",
              maxHeight: "200px",
              overflowY: "auto",
              bgcolor: "background.paper",
              paddingTop: "10px", // Added padding-top to prevent clipping
              paddingBottom: "10px",
            }}
          >
            {droppedData.map((pair) => (
              <ListItem
                key={pair.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 0,
                  paddingRight: 0,
                  marginBottom: "10px",
                  // Allow wrapping on small screens
                  flexWrap: "wrap",
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Key"
                      variant="outlined"
                      value={pair.key}
                      onChange={(e) => handleUpdate(pair.id, "key", e.target.value)}
                      fullWidth
                      size="small"
                      aria-label={`Key for entry ${pair.key}`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Value"
                      variant="outlined"
                      value={pair.value}
                      onChange={(e) => handleUpdate(pair.id, "value", e.target.value)}
                      fullWidth
                      size="small"
                      aria-label={`Value for entry ${pair.key}`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
                    <IconButton
                      onClick={() => handleRemove(pair.id)}
                      color="error"
                      aria-label={`Remove entry ${pair.key}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "10px",
            }}
          >
            <Button variant="contained" color="primary" onClick={() => handleExport("json")}>
              Export as JSON
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleExport("csv")}>
              Export as CSV
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClearAll}>
              Clear All
            </Button>
          </Box>
        </>
      )}

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StyledPaper>
  );
};

export default DropContainer;

