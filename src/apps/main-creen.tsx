// MainScreen.tsx
import { Alert, Backdrop, Box, Button, Checkbox, Chip, Container, Divider, FormControlLabel, Grid, Paper, Stack, TextField, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AutoAwesomeRounded as AutoAwesomeRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
  FileDownloadRounded as FileDownloadRoundedIcon,
  ContentCopyRounded as ContentCopyRoundedIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  PendingOutlined as PendingOutlinedIcon
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import PizZip from "pizzip";
import mammoth from "mammoth";
import { sendToGPT } from "../api/gpt";

const MainScreen = () => {
  const theme = useTheme();
  const [docFile] = useState<string>("/data/Sergei_Petrov_resume.docx");
  const [companyText, setCompanyText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [docHtml, setDocHtml] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [needCover, setNeedCover] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const TEMPLATE_SUMMARY =
    "Senior Software Engineer with 6+ years of experience in architecting distributed web systems using JavaScript, TypeScript, React and Node.js. Focuses on reducing operational overhead through automation and performance enhancements. Delivered solutions that eliminated 80% of manual workflows and improved system throughput by 85% across production-grade environments. Experienced in aligning system architecture with business objectives and maintaining long-term maintainability across multi-service deployments.";
  const TEMPLATE_SKILLS =
    "JavaScript, TypeScript, React, Next.js, Node.js, Express.js, Nest.js, HTML, CSS, SCSS, Tailwind CSS, Python, Django, PHP, Laravel, Symfony, Rust, React Native, Flutter, Three.js, GSAP, MySQL, PostgreSQL, MongoDB, Firebase, MSSQL, WordPress, Zapier, N8N, Make";
  const DEFAULT_SKILLS_DISPLAY =
    "JavaScript, TypeScript, React.js, Next.js, Node.js, Express.js, Nest.js, HTML, CSS, SCSS, Tailwind CSS, Python, Django, PHP, Laravel, Symfony, Rust, React Native, Flutter, Three.js, GSAP, MySQL, PostgreSQL, MongoDB, Firebase, MSSQL, WordPress, Zapier, N8N, Make";

  const [SUMMARY, setSummary] = useState<string>(TEMPLATE_SUMMARY);
  const [SKILLS, setSkills] = useState<string>(DEFAULT_SKILLS_DISPLAY);
  const summaryInDocRef = useRef<string>(TEMPLATE_SUMMARY);
  const skillsInDocRef = useRef<string>(TEMPLATE_SKILLS);

  const skillChips = SKILLS.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 12);
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3001";

  const statusChips = [
    { label: "Template ready", active: Boolean(docHtml) },
    { label: "Context added", active: Boolean(companyName && companyText) },
    { label: "PDF generated", active: Boolean(pdfUrl) }
  ];
  const readyForDownload = Boolean(pdfUrl);
  const coverLetterReady = needCover && Boolean(coverLetter);
  const gradientBg = "radial-gradient(circle at top, rgba(79,70,229,0.25), transparent 45%), radial-gradient(circle at 20% 20%, rgba(14,165,233,0.25), transparent 35%), linear-gradient(180deg, #030712 0%, #050b18 45%, #0b1222 100%)";
  const heroGradient = "linear-gradient(135deg, #312e81 0%, #1d1b3a 55%, #111028 100%)";
  const panelBg = "rgba(9, 12, 24, 0.9)";
  const surfaceBg = "rgba(15, 23, 42, 0.9)";
  const borderColor = "rgba(148, 163, 184, 0.18)";


  // Updated loadOriginal - saves the document to currentDoc
  const loadOriginal = async () => {
    const arrayBuffer = await fetch(docFile).then((r) => r.arrayBuffer());
    setCurrentDoc(arrayBuffer); // <- store buffer
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    setDocHtml(value);
    await convertDocxToPdf(arrayBuffer, "Sergei_Petrov_resume.docx");
    summaryInDocRef.current = TEMPLATE_SUMMARY;
    skillsInDocRef.current = TEMPLATE_SKILLS;
    setSummary(TEMPLATE_SUMMARY);
    setSkills(DEFAULT_SKILLS_DISPLAY);
  };


  useEffect(() => {
    loadOriginal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docFile]);

  // ConvertAPI JSON (returns a Blob URL)
  // api/convert.ts
  async function convertDocxToPdf(arrayBuffer: ArrayBuffer, outputName: string, jobDesc?: string, company?: string) {
    // convert ArrayBuffer to base64
    const base64File = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const response = await fetch(`${API_BASE_URL}/api/convert-docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64File,
        fileName: `Sergei_Petrov_resume_${companyName}.pdf`,
        jobDescription: jobDesc || companyText,
        companyName: company || companyName
      }),
    });

    if (!response.ok) {
      throw new Error("Conversion error on the server");
    }

    const pdfBlob = await response.blob();
    setPdfUrl(URL.createObjectURL(pdfBlob));

    console.log(pdfBlob);
  }



  // Inside MainScreen (at the top, next to other useState)
  const [currentDoc, setCurrentDoc] = useState<ArrayBuffer | null>(null);

  // Canonicalization of a character: 1 char -> 1 char | null (if whitespace)
  const canonChar = (ch: string): string | null => {
    // spaces/NBSP/zero-width -> skip
    if (/[\s\u00A0\u200B\u200C\u200D]/.test(ch)) return null;

    const code = ch.charCodeAt(0);
    switch (code) {
      // different dashes -> regular hyphen
      case 0x2010:
      case 0x2011:
      case 0x2012:
      case 0x2013:
      case 0x2014:
      case 0x2212:
        return "-";
      // single quotes
      case 0x2018:
      case 0x2019:
      case 0x02BC:
        return "'";
      // double quotes
      case 0x201C:
      case 0x201D:
        return '"';
      // convert ellipsis to a period (treat each dot as an individual period)
      case 0x2026:
        return ".";
      default:
        return ch.toLowerCase();
    }
  };

  // Convert a string to canonicalized (removes spaces and normalizes characters)
  const canonString = (s: string) =>
    Array.from(s)
      .map(canonChar)
      .filter((c): c is string => c !== null)
      .join("");

  // 1) Pure function: one replacement -> new buffer

  const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const XML_NS = "http://www.w3.org/XML/1998/namespace";

  function createNbspParagraph(xmlDoc: Document): Element {
    const p = xmlDoc.createElementNS(W_NS, "w:p");
    const r = xmlDoc.createElementNS(W_NS, "w:r");
    const t = xmlDoc.createElementNS(W_NS, "w:t");
    t.setAttributeNS(XML_NS, "xml:space", "preserve");
    t.textContent = "\u00A0";
    r.appendChild(t);
    p.appendChild(r);
    return p;
  }

  function getElementsByLocalName(root: Document | Element, local: string): Element[] {
    const byNs = Array.from(root.getElementsByTagNameNS(W_NS, local));
    if (byNs.length > 0) return byNs;
    // fallback (some parsers expose prefixed names)
    return Array.from((root as any).getElementsByTagName?.("w:" + local) || []);
  }

  function isParagraphVisuallyEmpty(p: Element): boolean {
    // 1) check w:t
    const tNodes = getElementsByLocalName(p, "t").filter(n => p.contains(n));
    for (const t of tNodes) {
      const txt = (t.textContent || "").replace(/\u00A0/g, " ").trim();
      if (txt.length > 0) return false;
    }
    // 2) if there is drawing/pict/object/tbl/br — consider it not empty
    if (getElementsByLocalName(p, "drawing").some(n => p.contains(n))) return false;
    if (getElementsByLocalName(p, "pict").some(n => p.contains(n))) return false;
    if (getElementsByLocalName(p, "object").some(n => p.contains(n))) return false;
    if (getElementsByLocalName(p, "tbl").some(n => p.contains(n))) return false;
    if (getElementsByLocalName(p, "br").some(n => p.contains(n))) return false;
    return true;
  }


  function compressEmptyParagraphsToSingleNbsp(xmlDoc: Document) {
    const bodies = getElementsByLocalName(xmlDoc, "body");
    const body = bodies[0];
    if (!body) return;

    // save sectPr
    const sectPrNodes = getElementsByLocalName(body.ownerDocument!, "sectPr").filter(n => body.contains(n));
    const sectPr = sectPrNodes[0];
    if (sectPr) body.removeChild(sectPr);

    const paras = getElementsByLocalName(xmlDoc, "p").filter(p => body.contains(p));
    const out: Element[] = [];
    let sawEmptySequence = false;

    for (const p of paras) {
      if (isParagraphVisuallyEmpty(p)) {
        sawEmptySequence = true;
        continue;
      } else {
        if (sawEmptySequence) {
          out.push(createNbspParagraph(xmlDoc));
          sawEmptySequence = false;
        }
        out.push(p.cloneNode(true) as Element);
      }
    }

    if (sawEmptySequence) out.push(createNbspParagraph(xmlDoc));

    // clear body and insert out + sectPr
    while (body.firstChild) body.removeChild(body.firstChild);
    for (const n of out) body.appendChild(n);
    if (sectPr) body.appendChild(sectPr);
  }

  /**
   * replaceInDocxBuffer — makes a replacement by canonicalized search and then compresses empty paragraphs
   */
  const replaceInDocxBuffer = async (
    inputBuffer: ArrayBuffer,
    searchVal: string,
    replaceVal: string
  ): Promise<ArrayBuffer> => {
    const zip = new (PizZip as any)(inputBuffer);
    const textXml = zip.file("word/document.xml")?.asText?.() || "";
    if (!textXml) throw new Error("word/document.xml not found");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(textXml, "application/xml");

    // get all w:t nodes (namespace-aware)
    const tNodes = getElementsByLocalName(xmlDoc, "t");

    type NodeInfo = { node: Element; orig: string; canon: string; mapCanonToOrig: number[] };
    const nodesInfo: NodeInfo[] = [];

    for (const n of tNodes) {
      const orig = n.textContent ?? "";
      let canon = "";
      const mapCanonToOrig: number[] = [];
      for (let i = 0; i < orig.length; i++) {
        const c = canonChar(orig[i]);
        if (c !== null) {
          canon += c;
          mapCanonToOrig.push(i);
        }
      }
      nodesInfo.push({ node: n, orig, canon, mapCanonToOrig });
    }

    const searchSpace = nodesInfo.map(ni => ni.canon).join("");
    const needle = canonString(searchVal || "");
    if (!needle) throw new Error("Empty search string after normalization.");
    const startIndex = searchSpace.indexOf(needle);
    if (startIndex === -1) throw new Error("Phrase not found (after normalization).");

    // locate start node and offset
    let cur = 0, nodeIdx = 0;
    while (nodeIdx < nodesInfo.length && cur + nodesInfo[nodeIdx].canon.length <= startIndex) {
      cur += nodesInfo[nodeIdx].canon.length;
      nodeIdx++;
    }
    if (nodeIdx >= nodesInfo.length) throw new Error("Error calculating position.");
    let offsetInNode = startIndex - cur;
    let remaining = needle.length;

    const edits: { idx: number; newText: string }[] = [];
    let inserted = false;

    while (remaining > 0 && nodeIdx < nodesInfo.length) {
      const ni = nodesInfo[nodeIdx];
      const available = ni.canon.length - offsetInNode;
      const take = Math.max(0, Math.min(available, remaining));
      if (take > 0) {
        const startOrigIndex = ni.mapCanonToOrig[offsetInNode];
        const endOrigIndex = ni.mapCanonToOrig[offsetInNode + take - 1];
        if (startOrigIndex === undefined || endOrigIndex === undefined) {
          throw new Error("Error mapping characters.");
        }
        if (!inserted) {
          const prefix = ni.orig.slice(0, startOrigIndex);
          const suffix = ni.orig.slice(endOrigIndex + 1);
          edits.push({ idx: nodeIdx, newText: prefix + replaceVal + suffix });
          inserted = true;
        } else {
          const suffix = ni.orig.slice(endOrigIndex + 1);
          edits.push({ idx: nodeIdx, newText: suffix });
        }
        remaining -= take;
      }
      nodeIdx++;
      offsetInNode = 0;
    }

    if (!inserted) throw new Error("Failed to insert replacement.");

    // apply edits
    for (const e of edits) {
      const targetNode = nodesInfo[e.idx].node;
      targetNode.textContent = e.newText;
    }

    // compress empty paragraphs -> keep only single NBSP paragraph where sequences existed
    compressEmptyParagraphsToSingleNbsp(xmlDoc);

    // serialize back
    const serializer = new XMLSerializer();
    zip.file("word/document.xml", serializer.serializeToString(xmlDoc));

    const outBlob = zip.generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    return await outBlob.arrayBuffer();
  };

  // 2) Updated handleReplace: returns a buffer, state only touches if baseBuffer is not passed
  const handleReplace = async (
    auto = false,
    search?: string,
    replace?: string,
    baseBuffer?: ArrayBuffer
  ): Promise<ArrayBuffer> => {
    try {
      const source = baseBuffer ?? currentDoc;
      if (!source) {
        if (!auto) alert("Document not loaded yet");
        throw new Error("Document not loaded yet");
      }
      const searchVal = search ?? searchText;
      const replaceVal = replace ?? replaceText;

      const updatedBuffer = await replaceInDocxBuffer(source, searchVal, replaceVal);

      // If we call it alone — update UI right here
      if (!baseBuffer) {
        setCurrentDoc(updatedBuffer);
        const { value: newHtml } = await mammoth.convertToHtml({ arrayBuffer: updatedBuffer });
        setDocHtml(newHtml);
        await convertDocxToPdf(updatedBuffer, "resume_replaced.docx");
      }
      return updatedBuffer;
    } catch (err) {
      console.error("handleReplace error:", err);
      if (!auto) alert("Error processing file (see console).");
      throw err;
    }
  };

  // 3) Sequential replacements in handleSearchKeywords: we push the buffer manually and commit once
  const handleSearchKeywords = async () => {
    const coverLetterPromt = needCover ? `+ separated by ('---') Write a professional and engaging cover letter for the following job posting named ${companyName}.

  About me:
  I am Sergei Petrov, an enthusiastic Full Stack Engineer with 6 years of experience in web development.

  Style:
  - Keep the letter concise (3–4 paragraphs).
  - Start with enthusiasm about the company and role.
  - Highlight my fast learning, adaptability, and ability to combine technical and business skills.
  - Show how I can bring value and help the business grow.
  - End with a confident but polite closing that invites further discussion.
  ` : '';

    try {
      setLoading(true);
      const response = await sendToGPT(
        `Find ATS-friendly keywords for real SKILLS only base on ${SKILLS}, separated by a comma and a space - ${companyText} + separated by ('---') rewrite my SUMMARY for the vacancy without changing the structure or meaning, limit 65 words (560 characters) in EN so that achievements are visible - ${SUMMARY} ${coverLetterPromt}`
      );
      const [responseKeywords, responseSummary, responseLetter] = response.split('---');

      if (!currentDoc) {
        console.warn("Document not loaded yet — skipping replacements.");
        return;
      }

      if (responseLetter) {
        setCoverLetter(responseLetter);
      }

      const replaceSummary = responseSummary.trim();
      const replaceSkills = responseKeywords.trim();

      // Pinned search strings that reflect what's currently stored in the DOCX.
      const searchSummary = summaryInDocRef.current;
      const searchSkills = skillsInDocRef.current;

      setSearchText(searchSummary);
      setReplaceText(replaceSummary);
      let workingBuffer = (await handleReplace(true, searchSummary, replaceSummary, currentDoc)) as ArrayBuffer;

      setSearchText(searchSkills);
      setReplaceText(replaceSkills);
      workingBuffer = (await handleReplace(true, searchSkills, replaceSkills, workingBuffer)) as ArrayBuffer;

      summaryInDocRef.current = replaceSummary;
      skillsInDocRef.current = replaceSkills;

      setCurrentDoc(workingBuffer);
      const { value: newHtml } = await mammoth.convertToHtml({ arrayBuffer: workingBuffer });
      setDocHtml(newHtml);
      await convertDocxToPdf(workingBuffer, "resume_replaced.docx");

      setSummary(replaceSummary);
      setSkills(replaceSkills);
    } catch (err: any) {
      console.error("handleSearchKeywords error:", err);
      alert(err?.message?.includes("Phrase not found")
        ? "Could not locate the original summary/skills inside the DOCX. Please ensure you have not manually edited the template text."
        : "Failed to tailor the resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Sergei_Petrov_resume_${companyName}.pdf`;
    a.click();
  };

  const handleCopyCoverLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: gradientBg,
        py: { xs: 4, md: 8 }
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 5,
            mb: 5,
            background: heroGradient,
            color: "#fff",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={600}>
                AI Resume Tailor
              </Typography>
              {/* <Typography variant="body1" sx={{ mt: 1.5, maxWidth: "720px", opacity: 0.85 }}>
                Upload your base resume, paste the job description, and let the studio refresh your summary, skills, and optional cover letter with one click.
              </Typography> */}
            </Box>
            {/* <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {statusChips.map((chip) => (
                <Chip
                  key={chip.label}
                  label={chip.label}
                  icon={chip.active ? <CheckCircleRoundedIcon /> : <PendingOutlinedIcon />}
                  color={chip.active ? "success" : "default"}
                  variant={chip.active ? "filled" : "outlined"}
                  sx={{
                    color: chip.active ? undefined : "rgba(226,232,240,0.86)",
                    borderColor: chip.active ? "rgba(209,250,229,0.6)" : "rgba(148,163,184,0.5)",
                    "& .MuiChip-icon": {
                      color: chip.active ? undefined : "rgba(226,232,240,0.86)"
                    }
                  }}
                />
              ))}
            </Stack> */}
          </Stack>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: panelBg,
                border: `1px solid ${borderColor}`
              }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Job context
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Provide the role details so the assistant can rephrase your resume with relevant language.
                  </Typography>
                </Box>
                <TextField
                  variant="filled"
                  label="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Robotics"
                  fullWidth
                />
                <TextField
                  multiline
                  minRows={5}
                  maxRows={18}
                  variant="filled"
                  label="Job posting text"
                  value={companyText}
                  onChange={(e) => setCompanyText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  fullWidth
                />
                <Divider />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={needCover}
                      onChange={(e) => setNeedCover(e.target.checked)}
                    />
                  }
                  label="Also craft a cover letter"
                />
                {needCover && (
                  <Stack spacing={1.5}>
                    <TextField
                      multiline
                      minRows={5}
                      maxRows={18}
                      variant="filled"
                      label="Cover letter"
                      fullWidth
                      value={coverLetter}
                      placeholder="Your tailored cover letter will appear here after generation."
                      InputProps={{ readOnly: true }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyRoundedIcon />}
                      onClick={handleCopyCoverLetter}
                      disabled={!coverLetterReady}
                    >
                      Copy cover letter
                    </Button>
                  </Stack>
                )}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    startIcon={<AutoAwesomeRoundedIcon />}
                    onClick={() => handleSearchKeywords()}
                    disabled={loading}
                  >
                    Generate tailored resume
                  </Button>
                  <Button
                    fullWidth
                    size="large"
                    variant="outlined"
                    color="secondary"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={loadOriginal}
                    disabled={loading}
                  >
                    Reset to original
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              {/* <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: `1px solid ${borderColor}`,
                  bgcolor: panelBg
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Live resume preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Changes are rendered from the DOCX file after each update.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${borderColor}`,
                      background: surfaceBg,
                      p: 2,
                      maxHeight: 360,
                      overflowY: "auto"
                    }}
                    dangerouslySetInnerHTML={{ __html: docHtml }}
                  />
                  <Divider />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current summary
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {SUMMARY}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Highlighted skills
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {skillChips.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            variant="outlined"
                            size="small"
                            sx={{
                              borderColor,
                              color: theme.palette.text.secondary
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Stack>
              </Paper> */}

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: `1px solid ${borderColor}`,
                  bgcolor: panelBg
                }}
              >
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        PDF preview
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Export-ready document generated on the server.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<FileDownloadRoundedIcon />}
                      onClick={downloadPdf}
                      disabled={!readyForDownload}
                    >
                      Download PDF
                    </Button>
                  </Box>
                  {pdfUrl ? (
                    <Box
                      sx={{
                        border: `1px solid ${borderColor}`,
                        borderRadius: 3,
                        overflow: "hidden",
                        minHeight: 320,
                        background: surfaceBg
                      }}
                    >
                      <iframe
                        src={pdfUrl}
                        width="100%"
                        height="420px"
                        style={{ border: "none", display: "block" }}
                      />
                    </Box>
                  ) : (
                    <Alert
                      severity="info"
                      variant="outlined"
                      sx={{ borderColor, color: theme.palette.text.secondary }}
                    >
                      Run “Generate tailored resume” to create a fresh PDF preview.
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1, backdropFilter: "blur(2px)" }}
        open={loading}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography>Crafting your tailored resume...</Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
};

export default MainScreen;
