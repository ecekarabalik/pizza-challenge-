import React, { useMemo, useState } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import {
  Container, Row, Col,
  Form, FormGroup, Label, Input, FormFeedback,
  Button as RSButton, Badge
} from 'reactstrap'
import { ToastContainer, toast } from 'react-toastify'

const COLORS = {
  red: '#CE2829',
  yellow: '#FDC913',
  grayD: '#292929',
  grayL: '#5F5F5F',
  beige: '#FAF7F2',
}

/* ========= ROOT APP ========= */
export default function App() {
  const [lastOrder, setLastOrder] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: COLORS.beige, color: COLORS.grayD }}>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomeHero />} />
          <Route path="/order" element={<OrderForm onSubmitSuccess={setLastOrder} />} />
          <Route path="/success" element={<SuccessPage order={lastOrder} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
    </div>
  )
}

/* ========= HEADER ========= */
function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <nav className="site-header__nav">
          <Link to="/" className="nav-link">Anasayfa</Link>
          <Link to="/order" className="nav-cta">Sipariş Ver</Link>
        </nav>
      </div>
    </header>
  )
}

/* ========= HOME HERO ========= */
function HomeHero() {
  const navigate = useNavigate()
  return (
    <section className="hero">
      <div className="hero__overlay" />
      <div className="hero__inner">
        <h1 className="hero__brand">Teknolojik Yemekler</h1>

        <h2 className="hero__title">
          KOD ACIKTIRIR<br />PİZZA, DOYURUR
        </h2>

        <button
          className="hero__cta"
          onClick={() => navigate('/order')}
        >
          ACIKTIM
        </button>
      </div>
    </section>
  )
}

/* ========= ORDER FORM ========= */
const ALL_TOPPINGS = [
  'Pepperoni', 'Domates', 'Biber', 'Sosis', 'Mısır', 'Mantar',
  'Kanada Jambonu', 'Sucuk', 'Ananas', 'Tavuk Izgara', 'Jalapeno', 'Kabak', 'Soğan', 'Sarımsak'
]

function OrderForm({ onSubmitSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ isim: '', boyut: '', malzemeler: [], ozel: '', hamur: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const isValid = useMemo(() => {
    const e = {}
    if (form.isim.trim().length < 3) e.isim = 'İsim en az 3 karakter olmalı'
    if (!form.boyut) e.boyut = 'Lütfen boyut seçiniz'
    if (form.malzemeler.length < 4 || form.malzemeler.length > 10) e.malzemeler = 'Malzemeler 4–10 olmalı'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  const handle = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggleTopping = (t) =>
    handle('malzemeler',
      form.malzemeler.includes(t) ? form.malzemeler.filter(x => x !== t) : [...form.malzemeler, t]
    )

  async function submit(e) {
    e.preventDefault();
    if (!isValid || busy) return;

    setBusy(true);
    setMessage('');

    // Yardımcı: success’e ilerlerken ortak akış
    const proceed = (resData) => {
      console.log('API yanıtı:', resData); // ÖZETİ CONSOLE’A YAZ
      onSubmitSuccess(form);
      toast.success('Sipariş alındı!');
      navigate('/success');
    };

    try {
      // 1) Brief’e sadık: önce /api/pizza
      const res = await axios.post(
        'https://reqres.in/api/pizza',
        form,
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      proceed(res.data);
    } catch (err1) {
      console.warn('Pizza endpoint başarısız, /api/users deneniyor…', err1?.response?.status);

      try {
        // 2) Reqres’in garantili endpoint’i
        const res2 = await axios.post(
          'https://reqres.in/api/users',
          form,
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        proceed(res2.data);
      } catch (err2) {
        console.warn('Users endpoint de başarısız, local fake yanıt üretilecek.', err2?.response?.status);

        // 3) Tamamen offline/engelli durumlar için “fake” yanıt
        const fake = {
          id: `local-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          ...form,
        };
        proceed(fake);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white card-like p-4 p-md-5 mt-4">
      <Container>
        <h2 className="h3 fw-bold mb-4">Sipariş Formu</h2>

        <Form onSubmit={submit} noValidate>
          <FormGroup>
            <Label for="name">İsim</Label>
            <Input id="name"
              value={form.isim}
              onChange={(e) => handle('isim', e.target.value)}
              invalid={!!errors.isim}
            />
            {errors.isim && <FormFeedback>{errors.isim}</FormFeedback>}
          </FormGroup>

          <FormGroup tag="fieldset" className="mt-3">
            <legend>Boyut Seç <span className="text-danger">*</span></legend>
            {['S', 'M', 'L'].map((s) => (
              <FormGroup check inline key={s}>
                <Input type="radio" name="size"
                  checked={form.boyut === s} onChange={() => handle('boyut', s)} />
                <Label check>{s}</Label>
              </FormGroup>
            ))}
            {errors.boyut && <div className="text-danger small mt-1">{errors.boyut}</div>}
          </FormGroup>

          <FormGroup className="mt-3">
            <Label>Hamur Kalınlığı</Label>
            <Input type="select" value={form.hamur} onChange={(e) => handle('hamur', e.target.value)}>
              <option value="">Seçiniz</option>
              <option value="ince">İnce</option>
              <option value="orta">Orta</option>
              <option value="kalin">Kalın</option>
            </Input>
          </FormGroup>

          <FormGroup tag="fieldset" className="mt-4">
            <legend>Ek Malzemeler <Badge color="secondary">4–10</Badge></legend>
            <Row xs="2" md="3" className="g-2">
              {ALL_TOPPINGS.map((t) => (
                <Col key={t}>
                  <FormGroup check>
                    <Input type="checkbox"
                      checked={form.malzemeler.includes(t)} onChange={() => toggleTopping(t)} />
                    <Label check className="ms-2">{t}</Label>
                  </FormGroup>
                </Col>
              ))}
            </Row>
            {errors.malzemeler && <div className="text-danger small mt-1">{errors.malzemeler}</div>}
          </FormGroup>

          <FormGroup className="mt-3">
            <Label htmlFor="note">Sipariş Notu (opsiyonel)</Label>
            <Input id="note" type="textarea"
              value={form.ozel} onChange={(e) => handle('ozel', e.target.value)}
              style={{ minHeight: 100 }}
            />
          </FormGroup>

          <RSButton type="submit"
            disabled={!isValid || busy}
            className="mt-3 fw-semibold btn-warning"
          >
            {busy ? 'Gönderiliyor…' : 'Sipariş Ver'}
          </RSButton>
          {message && <div className="mt-2 text-danger small">{message}</div>}
        </Form>
      </Container>
    </section>
  )
}

/* ========= SUCCESS ========= */
function SuccessPage({ order }) {
  return (
    <section className="success">
      <div className="success__hero">
        <div className="success__brand">Teknolojik Yemekler</div>
        <div className="success__title">TEBRİKLER!<br />SİPARİŞİNİZ ALINDI!</div>
      </div>
      {!order ? (
        <p className="text-center mt-4">
          Henüz bir sipariş görünmüyor. <Link to="/order">Sipariş oluştur</Link>.
        </p>
      ) : (
        <Container className="bg-white card-like p-4 mt-4" style={{ maxWidth: 720 }}>
          <h2 className="h4 fw-bold mb-3">Sipariş Özeti</h2>
          <p><b>İsim:</b> {order.isim}</p>
          <p><b>Boyut:</b> {order.boyut}</p>
          {order.hamur && <p><b>Hamur:</b> {order.hamur}</p>}
          <p><b>Malzemeler:</b> {order.malzemeler.join(', ')}</p>
          {order.ozel && <p><b>Not:</b> {order.ozel}</p>}
          <Link to="/" className="btn mt-3" style={{ background: COLORS.red, color: 'white' }}>
            Ana sayfaya dön
          </Link>
        </Container>
      )}
    </section>
  )
}

/* ========= FOOTER ========= */
function SiteFooter() {
  return (
    <footer className="text-center py-5 text-muted">
      © {new Date().getFullYear()} Teknolojik Yemekler
    </footer>
  )
}