// MainScreen.tsx
import { Box, Button, Checkbox, Container, Dialog, DialogContent, FormControlLabel, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import mammoth from "mammoth";
import { sendToGPT } from "../api/gpt";
import { CheckBox } from "docx";

const API_KEY = "cJO6cXTcwXVsLm77tppuf0J6AXZ237qy";

// helper: ArrayBuffer -> base64 (chunked to avoid stack)
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    // Fix: spread operator may not work on Uint8Array depending on TS config.
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

const normalize = (s: string) => {
  // убираем все пробелы, табы, переноса строк и NBSP
  return s.replace(/[\s\u00A0]+/g, "");
};

const MainScreen = () => {
  const [docFile] = useState<string>("/data/Sergei_Petrov_resume.docx");
  const [companyText, setCompanyText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [docHtml, setDocHtml] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [needCover, setNeedCover] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const [SUMMARY, setSummary] = useState<string>("Senior Software Engineer with 6+ years of experience in architecting distributed web systems using JavaScript, TypeScript, React and Node.js. Focuses on reducing operational overhead through automation and performance enhancements. Delivered solutions that eliminated 80% of manual workflows and improved system throughput by 85% across production-grade environments. Experienced in aligning system architecture with business objectives and maintaining long-term maintainability across multi-service deployments.");
  const [SKILLS, setSkills] = useState<string>("JavaScript, TypeScript, React, Next.js, Node.js, Express.js, Nest.js, HTML, CSS, SCSS, Tailwind CSS, Python, Django, PHP, Laravel, Symfony, Rust, React Native, Flutter, Three.js, GSAP, MySQL, PostgreSQL, MongoDB, Firebase, MSSQL, WordPress, Zapier, N8N, Make");


// Обновлённый loadOriginal — сохраняет документ в currentDoc
const loadOriginal = async () => {
  const arrayBuffer = await fetch(docFile).then((r) => r.arrayBuffer());
  setCurrentDoc(arrayBuffer); // <- сохраняем
  const { value } = await mammoth.convertToHtml({ arrayBuffer });
  setDocHtml(value);
  await convertDocxToPdf(arrayBuffer, "Sergei_Petrov_resume.docx");
};


  useEffect(() => {
    loadOriginal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docFile]);

  // // автозамена через 3 сек
  // useEffect(() => {
  //   const t = setTimeout(() => {
  //     if (replaceText.trim() === "") {
  //       loadOriginal();
  //     } else {
  //       handleReplace(true);
  //     }
  //   }, 3000);
  //   return () => clearTimeout(t);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [replaceText]);

  // ConvertAPI JSON (возвращаем Blob URL)
  // api/convert.ts
async function convertDocxToPdf(arrayBuffer: ArrayBuffer, outputName: string, jobDesc?: string, company?: string) {
  // преобразуем ArrayBuffer в base64
  const base64File = btoa(
    new Uint8Array(arrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const response = await fetch("http://localhost:3001/api/convert-docx", {
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
    throw new Error("Ошибка при конвертации на сервере");
  }

  const pdfBlob = await response.blob();
  setPdfUrl(URL.createObjectURL(pdfBlob));

  console.log(pdfBlob);
}



// Внутри MainScreen (вверху, рядом с другими useState)
const [currentDoc, setCurrentDoc] = useState<ArrayBuffer | null>(null);

// Канонизация символа: 1 char -> 1 char | null (если пробельный)
const canonChar = (ch: string): string | null => {
  // пробелы/NBSP/zero-width -> пропускаем
  if (/[\s\u00A0\u200B\u200C\u200D]/.test(ch)) return null;

  const code = ch.charCodeAt(0);
  switch (code) {
    // разные тире -> обычный дефис
    case 0x2010:
    case 0x2011:
    case 0x2012:
    case 0x2013:
    case 0x2014:
    case 0x2212:
      return "-";
    // одиночные кавычки
    case 0x2018:
    case 0x2019:
    case 0x02BC:
      return "'";
    // двойные кавычки
    case 0x201C:
    case 0x201D:
      return '"';
    // многоточие -> обычная точка (по одному символу)
    case 0x2026:
      return ".";
    default:
      return ch.toLowerCase();
  }
};

// Преобразование строки в канонизированную (удаляет пробелы и нормализует символы)
const canonString = (s: string) =>
  Array.from(s)
    .map(canonChar)
    .filter((c): c is string => c !== null)
    .join("");

  // 1) Чистая функция: одна замена -> новый буфер

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
  // 1) проверим w:t
  const tNodes = getElementsByLocalName(p, "t").filter(n => p.contains(n));
  for (const t of tNodes) {
    const txt = (t.textContent || "").replace(/\u00A0/g, " ").trim();
    if (txt.length > 0) return false;
  }
  // 2) если есть drawing/pict/object/tbl/br — считаем НЕ пустым
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

  // сохранение sectPr
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

  // очистить body и вставить out + sectPr
  while (body.firstChild) body.removeChild(body.firstChild);
  for (const n of out) body.appendChild(n);
  if (sectPr) body.appendChild(sectPr);
}

/**
 * replaceInDocxBuffer — делает замену по канонизированному поиску и затем сжимает пустые абзацы
 */
const replaceInDocxBuffer = async (
  inputBuffer: ArrayBuffer,
  searchVal: string,
  replaceVal: string
): Promise<ArrayBuffer> => {
  const zip = new (PizZip as any)(inputBuffer);
  const textXml = zip.file("word/document.xml")?.asText?.() || "";
  if (!textXml) throw new Error("word/document.xml не найден");

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
  if (!needle) throw new Error("Пустая строка поиска после нормализации.");
  const startIndex = searchSpace.indexOf(needle);
  if (startIndex === -1) throw new Error("Фраза не найдена (после нормализации).");

  // locate start node and offset
  let cur = 0, nodeIdx = 0;
  while (nodeIdx < nodesInfo.length && cur + nodesInfo[nodeIdx].canon.length <= startIndex) {
    cur += nodesInfo[nodeIdx].canon.length;
    nodeIdx++;
  }
  if (nodeIdx >= nodesInfo.length) throw new Error("Ошибка вычисления позиции.");
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
        throw new Error("Ошибка маппинга символов.");
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

  if (!inserted) throw new Error("Не удалось вставить замену.");

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

// 2) Обновлённый handleReplace: возвращает буфер, состояние трогает только если baseBuffer не передан
const handleReplace = async (
  auto = false,
  search?: string,
  replace?: string,
  baseBuffer?: ArrayBuffer
): Promise<ArrayBuffer | void> => {
  try {
    const source = baseBuffer ?? currentDoc;
    if (!source) {
      if (!auto) alert("Документ ещё не загружен");
      return;
    }
    const searchVal = search ?? searchText;
    const replaceVal = replace ?? replaceText;

    const updatedBuffer = await replaceInDocxBuffer(source, searchVal, replaceVal);

    // Если вызываем одиночно — обновляем UI прямо тут
    if (!baseBuffer) {
      setCurrentDoc(updatedBuffer);
      const { value: newHtml } = await mammoth.convertToHtml({ arrayBuffer: updatedBuffer });
      setDocHtml(newHtml);
      await convertDocxToPdf(updatedBuffer, "resume_replaced.docx");
    }
    return updatedBuffer;
  } catch (err) {
    console.error("handleReplace error:", err);
    if (!auto) alert("Ошибка при обработке файла (см. консоль).");
  }
};

// 3) Последовательные замены в handleSearchKeywords: буфер протаскиваем вручную и коммитим один раз
const handleSearchKeywords = async () => {
  const coverLetterPromt = needCover ? `+ через ('---') Write a professional and engaging cover letter for the following job posting named ${companyName}.

  About me:  
  I am Sergei Petrov an enthusiastic Full Stack Engineer with 4 years of experience in web development 

  Style:  
  - Keep the letter concise (3–4 paragraphs).  
  - Start with enthusiasm about the company and role.  
  - Highlight my fast learning, adaptability, and ability to combine technical and business skills.  
  - Show how I can bring value and help the business grow.  
  - End with a confident but polite closing, inviting to discuss my candidacy.
  ` : '';

  try {
    setLoading(true);
    const response = await sendToGPT(`Найди ключевые слова по вакансии (ats) для реальных SKILLS, только их, через запятую и пробел - ${companyText} + через разделение ('---') не меняя структуры и смысла поменяй под вакансию мое SUMMARY лимит 65 слов (560 символов) (EN), чтобы были видны заслуги - ${SUMMARY} ${coverLetterPromt}`)
    const [responseKeywords, responseSummary, responseLetter] = response.split('---');

    if (responseLetter) {
      setCoverLetter(responseLetter)
    }

    // setKeywords(response);

    const search1 = SUMMARY;
    const replace1 = responseSummary.trim();

    const search2 = SKILLS;
    const replace2 = responseKeywords.trim();

    if (!currentDoc) {
      console.warn("Документ ещё не загружен — пропускаем замены.");
      return;
    }

    // Для наглядности обновим поля (не влияет на сам буфер)
    setSearchText(search1);
    setReplaceText(replace1);

    // первая замена поверх текущего буфера
    let buf = await handleReplace(true, search1, replace1, currentDoc) as ArrayBuffer;

    // вторая замена поверх результата первой
    setSearchText(search2);
    setReplaceText(replace2);
    buf = (await handleReplace(true, search2, replace2, buf)) as ArrayBuffer;

    // один коммит состояния/превью/пдф
    setCurrentDoc(buf);
    const { value: newHtml } = await mammoth.convertToHtml({ arrayBuffer: buf });
    setDocHtml(newHtml);
    await convertDocxToPdf(buf, "resume_replaced.docx");
    setTimeout(() => setLoading(false), 0);

    setSummary(replace1);
    setSkills(replace2);
  } catch (err) {
    console.error("handleSearchKeywords error:", err);
  }
};



  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Sergei_Petrov_resume_${companyName}.pdf`;
    a.click();
  };

  return (
    <Container sx={{ mt: 5 }}>
      {loading && <Dialog fullWidth

      open={loading}
      >
      <DialogContent>
        <Typography textAlign={'center'}>Loading...</Typography>
      </DialogContent>
      </Dialog>}
      <Typography variant="h4" gutterBottom textAlign="center">
        📄 DOCX redactor
      </Typography>

      <Box mt={2}>
        <TextField
          label="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          sx={{ mb: 2, width: '50%' }}
        />
        <TextField
          multiline
          minRows={3} // минимум строк
          maxRows={20}
          label="Job posting text"
          fullWidth
          value={companyText}
          onChange={(e) => setCompanyText(e.target.value)}
        />
        {needCover && (
        <>
        <Box>
          <TextField
            multiline
            sx={{ mt: 3 }}
            minRows={3}
            maxRows={20}
            label="Cover letter"
            fullWidth
            value={coverLetter}
          />
          <Button 
            sx={{ mt: 2 }} 
            variant="outlined" 
            onClick={() => navigator.clipboard.writeText(coverLetter)}
          >
            Copy all
          </Button>
          </Box>
        </>
      )}

        
        <FormControlLabel
        sx={{mt: 1}}
          control={
            <Checkbox
              checked={needCover}
              onChange={(e) => setNeedCover(e.target.checked)}
            />
          }
          label="Need cover letter?"
        />
{/* 
        <TextField
          disabled
          multiline
          sx={{mt: 3}}
          minRows={3}
          maxRows={20}
          label="keywords"
          fullWidth
          value={keywords}
          InputProps={{
            readOnly: true,
          }}
        /> */}
      </Box>

      <Box mt={3} textAlign="center">
        <Button variant="contained" onClick={() => handleSearchKeywords()}>
          Start
        </Button>
      </Box>

      {/* <Box mt={5}>
        <TextField
          label="Текст для поиска"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Текст для замены"
          fullWidth
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          helperText="Все пробелы/переносы будут игнорироваться при поиске"
        />
      </Box> */}

      {/* <Box mt={3} textAlign="center">
        <Button variant="contained" onClick={() => handleReplace(false)}>
          🔄 Заменить текст и обновить PDF
        </Button>
      </Box> */}

      <Typography variant="h5" sx={{ mt: 4 }}>
        📖 Text preview:
      </Typography>
      <Box
        sx={{
          border: "1px solid #ccc",
          p: 2,
          mt: 2,
          background: "#fafafa",
          maxHeight: "400px",
          overflowY: "auto",
        }}
        dangerouslySetInnerHTML={{ __html: docHtml }}
      />

      {pdfUrl && (
      <>
        <Typography variant="h5" sx={{ mt: 4 }}>
          📑 PDF Preview:
        </Typography>

        <Box sx={{ border: "1px solid #ccc", mt: 2 }}>
          <iframe
            src={pdfUrl}
            width="100%"
            height="500px"
            style={{ border: "none", display: "block" }}
          />
          {/* Кнопка скачивания внутри той же рамки, прямо под iframe */}
          <Box sx={{ p: 2, textAlign: "center", borderTop: "1px solid #eee", background: "#fff" }}>
            <Button variant="contained" onClick={downloadPdf}>
              💾 Download PDF
            </Button>
          </Box>
        </Box>
      </>
    )}

    </Container>
  );
};

export default MainScreen;
