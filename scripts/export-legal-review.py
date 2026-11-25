"""Export review PDFs from the exact source used by the Astro preview.

Requires ReportLab + pypdf in the configured document runtime. Does not publish
legal documents, activate a version, read private RUTs or collect acceptances.
"""
import argparse
import hashlib
import json
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader
from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

rl_config.invariant = 1


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def font_pair():
    pairs = [
        (Path('C:/Windows/Fonts/times.ttf'), Path('C:/Windows/Fonts/timesbd.ttf')),
        (Path('/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf'),
         Path('/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf')),
    ]
    for regular, bold in pairs:
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont('Legal', str(regular)))
            pdfmetrics.registerFont(TTFont('Legal-Bold', str(bold)))
            pdfmetrics.registerFontFamily('Legal', normal='Legal', bold='Legal-Bold')
            return 'Legal', 'Legal-Bold'
    return 'Times-Roman', 'Times-Bold'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1] / 'src/content/legal-review-2026-11-24.json'
    bundle = json.loads(source.read_text(encoding='utf-8'))
    if bundle['status'] != 'review-only':
        raise ValueError('This exporter handles review-only material, never active legal terms.')
    args.output.mkdir(parents=True, exist_ok=True)
    regular, bold = font_pair()
    body = ParagraphStyle('Body', fontName=regular, fontSize=11.5, leading=15.8,
                          textColor=colors.black, alignment=TA_LEFT, spaceAfter=8,
                          allowWidows=0, allowOrphans=0)
    title = ParagraphStyle('Title', parent=body, fontName=bold, fontSize=17, leading=20.5,
                           spaceAfter=14, keepWithNext=True)
    heading = ParagraphStyle('Heading', parent=body, fontName=bold, fontSize=12.5,
                             leading=16, spaceBefore=10, spaceAfter=7, keepWithNext=True)
    subheading = ParagraphStyle('Subheading', parent=heading, fontSize=11.5,
                                leading=15.8, spaceBefore=7)
    note = ParagraphStyle('Note', parent=body, fontSize=10.5, leading=14)
    bullet = ParagraphStyle('Bullet', parent=body, leftIndent=12, firstLineIndent=-8)
    manifest = {'version': bundle['version'], 'status': bundle['status'],
                'sourceSha256': digest(source), 'format': 'Letter; 1 inch margins; 11.5 pt body', 'files': []}
    names = {
        'terminos': '01-Terminos-servicio-Cripton-2026-11-24.pdf',
        'privacidad': '02-Politica-datos-personales-Cripton-2026-11-24.pdf',
        'tratamiento-por-cuenta-del-cliente': '03-Anexo-tratamiento-cliente-Cripton-2026-11-24.pdf',
    }
    def para(text, style=body): return Paragraph(escape(text), style)
    for document in bundle['documents']:
        target = args.output / names[document['slug']]
        story = [para('CRIPTON · REVISIÓN CONTRACTUAL', subheading),
                 para(document['title'], title), para(bundle['notice'], note),
                 para(document['lead']), Spacer(1, 5)]
        for section in document['sections']:
            story.append(para(section['heading'], heading))
            story.extend(para(text) for text in section['paragraphs'])
            story.extend(para('• '+text, bullet) for text in section.get('items', []))
            for sub in section.get('subsections', []):
                story.append(para(sub['heading'], subheading))
                story.extend(para(text) for text in sub['paragraphs'])
        adoption = [para('Control de adopción — no forma parte de una aceptación vigente', heading)]
        adoption.extend(para('• '+item, bullet) for item in document['pending'])
        story.append(KeepTogether(adoption))

        def page(canvas, doc):
            canvas.saveState()
            canvas.setFont(regular, 9)
            canvas.drawString(72, 37, 'Cripton · Revisión 2026-11-24 · Sin vigencia')
            canvas.drawRightString(letter[0]-72, 37, f'Página {doc.page}')
            canvas.restoreState()

        pdf = SimpleDocTemplate(str(target), pagesize=letter, rightMargin=72,
                                leftMargin=72, topMargin=72, bottomMargin=72,
                                title=document['title'], author=bundle['provider']['name'],
                                subject='Revisión preparada; no activa ni sustituye aceptaciones anteriores')
        pdf.build(story, onFirstPage=page, onLaterPages=page)
        reader = PdfReader(target)
        # Text checks supplement, and do not replace, page rendering/visual QA.
        text = ' '.join(' '.join(p.extract_text().split()) for p in reader.pages)
        for section in document['sections']:
            if ' '.join(section['heading'].split()) not in text:
                raise ValueError(f'Missing section in PDF: {section["id"]}')
        if any(len((p.extract_text() or '').split()) < 20 for p in reader.pages):
            raise ValueError('Empty or nearly empty page requires review')
        manifest['files'].append({'name': target.name, 'sha256': digest(target), 'pages': len(reader.pages)})
    (args.output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (args.output / 'LEEME.txt').write_text(
        'Documentos Cripton SaaS — revisión 2026-11-24\n\n'
        'Tres documentos preparados para revisión. No están vigentes ni cambian contratos anteriores.\n'
        'El cierre de cada PDF enumera las dependencias de adopción.\n'
        'El manifiesto permite verificar los PDF contra la fuente única versionada de la web.\n'
        'No se incluyen el RUT ni los acuerdos privados originales.\n', encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__': main()
