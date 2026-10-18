import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertCircle, Check, Minus, Package, Plus, ShoppingBag } from 'lucide-react-native';
import { useSession } from '@/ctx';
import { useWorkspace } from '@/workspace';
import { colors, radii } from '@/theme';
import { createStoreOrder, getStoreCatalog, getStoreOrders } from '@/lib/mobileApi';
import type { StoreOrderInput, StoreProduct } from '@/lib/types';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, PrimaryButton } from '@/components/ui';

export default function StoreScreen() {
  const { session, user } = useSession();
  const { workspace, status, error, refresh } = useWorkspace();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<{ id: string; orderNumber?: string | null; status?: string | null; totalAmount?: number | null; createdAt?: string }[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; number: string | null } | null>(null);

  useEffect(() => {
    if (!workspace?.business) return;
    // Keep the shipping draft useful without overwriting edits after the form is open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
    setEmail(user?.email || workspace.business.email || '');
    setPhone(workspace.business.phone || user?.phone || '');
    setAddress(workspace.business.address || '');
    setCity(workspace.business.city || '');
    setState(workspace.business.state || '');
    setPincode(workspace.business.pincode || '');
  }, [user?.email, user?.id, user?.phone, user?.user_metadata?.full_name, user?.user_metadata?.name, workspace?.business]);

  useEffect(() => {
    if (!session?.access_token) return;
    let mounted = true;
    void Promise.all([getStoreCatalog(session.access_token), getStoreOrders(session.access_token)])
      .then(([catalog, orderResponse]) => {
        if (!mounted) return;
        setProducts(catalog.products || []);
        setOrders(orderResponse.orders || []);
      })
      .catch((loadError) => {
        if (mounted) setFormError(loadError instanceof Error ? loadError.message : 'The Pixora Store is temporarily unavailable.');
      });
    return () => { mounted = false; };
  }, [session?.access_token]);

  const cartItems = useMemo(() => products.filter((product) => (cart[product.id] || 0) > 0).map((product) => ({ product, quantity: cart[product.id] || 0 })), [cart, products]);
  const total = cartItems.reduce((sum, item) => sum + item.product.priceInr * item.quantity, 0);

  if (status === 'loading') return <LoadingState label="Loading your store…" />;
  if (status === 'error') return <ErrorState message={error || 'The store workspace could not be loaded.'} onRetry={() => void refresh()} />;
  if (status === 'empty' || !workspace) return <EmptyState icon={<ShoppingBag color={colors.blue} size={26} />} title="No store workspace linked" description="Your hardware catalog is scoped to the business linked to your Pixora account." actionLabel="Try again" onAction={() => void refresh()} />;

  const changeQuantity = (productId: string, delta: number) => {
    const product = products.find((item) => item.id === productId);
    setCart((current) => {
      const next = Math.min(product?.availableQty ?? 99, Math.max(0, (current[productId] || 0) + delta));
      const result = { ...current };
      if (next) result[productId] = next;
      else delete result[productId];
      return result;
    });
  };

  const submitOrder = async () => {
    setFormError(null);
    if (!session?.access_token) {
      setFormError('Sign in again before placing an order.');
      return;
    }
    if (!cartItems.length) {
      setFormError('Add at least one product to your cart.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setFormError('Name, email, phone, address, city, state, and pincode are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (phone.trim().replace(/\D/g, '').length < 7 || !/^\d{4,10}$/.test(pincode.trim())) {
      setFormError('Enter a valid phone number and 4–10 digit pincode.');
      return;
    }

    const input: StoreOrderInput = {
      businessId: workspace.business.id,
      customer: { name: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim() },
      shippingAddress: { address: address.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), country: 'India' },
      items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      notes: notes.trim() || undefined,
    };
    setIsSubmitting(true);
    try {
      const response = await createStoreOrder(session.access_token, input);
      setSubmittedOrder({ id: response.order.id, number: response.order.orderNumber || null });
      setCart({});
      void refresh(true);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'The order could not be submitted. No order was saved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <PageHeader title="Pixora Store" subtitle="Order branded NFC cards, QR stands, and bundles for your business." />
    <View style={styles.notice}><AlertCircle color={colors.blue} size={17} /><Text style={styles.noticeText}>Order requests are pending fulfilment review. No payment is collected in this mobile flow; Pixora support confirms stock, artwork, and the next step after submission.</Text></View>
    {products.length ? <View style={styles.productList}>{products.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id] || 0} onChangeQuantity={(delta) => changeQuantity(product.id, delta)} />)}</View> : <EmptyState icon={<Package color={colors.blue} size={26} />} title="Store catalogue unavailable" description="Pixora has not published the hardware catalogue yet. Try again later or contact support." actionLabel="Refresh" onAction={() => void refresh(true)} />}

    <Card style={styles.cartCard}><View style={styles.sectionHeading}><View style={styles.headingIcon}><ShoppingBag color={colors.blue} size={18} /></View><View style={styles.headingCopy}><Text style={styles.sectionTitle}>Your order</Text><Text style={styles.sectionBody}>{cartItems.length ? `${cartItems.length} product${cartItems.length === 1 ? '' : 's'} · ₹${total.toLocaleString('en-IN')}` : 'Add products above to start an order.'}</Text></View></View>{cartItems.length ? cartItems.map(({ product, quantity }) => <View key={product.id} style={styles.cartRow}><View style={styles.cartCopy}><Text style={styles.cartName}>{product.name}</Text><Text style={styles.cartPrice}>₹{(product.priceInr * quantity).toLocaleString('en-IN')}</Text></View><QuantityControl quantity={quantity} onChange={(delta) => changeQuantity(product.id, delta)} /></View>) : null}</Card>

    <Card style={styles.formCard}><Text style={styles.formTitle}>Delivery details</Text><Text style={styles.formHint}>Orders are sent to the Pixora fulfilment team for confirmation. No payment is taken in this mobile flow.</Text><StoreField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Recipient name" /><StoreField label="Email" value={email} onChangeText={setEmail} placeholder="you@business.com" keyboardType="email-address" autoCapitalize="none" /><StoreField label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone or WhatsApp" keyboardType="phone-pad" /><StoreField label="Delivery address" value={address} onChangeText={setAddress} placeholder="Street and building" /><View style={styles.fieldRow}><View style={styles.halfField}><StoreField label="City" value={city} onChangeText={setCity} placeholder="City" /></View><View style={styles.halfField}><StoreField label="State" value={state} onChangeText={setState} placeholder="State" /></View></View><StoreField label="Pincode" value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" /><StoreField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Branding or delivery notes" />{formError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{formError}</Text></View> : null}{submittedOrder ? <View style={styles.successBanner}><Check color={colors.mintText} size={18} /><View style={styles.successCopy}><Text style={styles.successTitle}>Order request submitted</Text><Text style={styles.successBody}>{submittedOrder.number ? `Order ${submittedOrder.number}` : `Reference ${submittedOrder.id.slice(0, 8)}`} · fulfilment will confirm the next step.</Text></View></View> : null}<PrimaryButton label={isSubmitting ? 'Submitting order…' : `Submit order · ₹${total.toLocaleString('en-IN')}`} onPress={() => void submitOrder()} disabled={isSubmitting || !cartItems.length} icon={<Package color="#fff" size={17} />} /></Card>
    <Text style={styles.ordersTitle}>Your order requests</Text>{orders.length ? orders.slice(0, 5).map((order) => <Card key={order.id} style={styles.orderCard}><View style={styles.orderHeader}><View style={styles.orderCopy}><Text style={styles.orderNumber}>{order.orderNumber || `Order ${order.id.slice(0, 8)}`}</Text><Text style={styles.orderMeta}>{order.status || 'Pending admin review'}{order.createdAt ? ` · ${new Date(order.createdAt).toLocaleDateString('en-IN')}` : ''}</Text></View><Text style={styles.orderAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</Text></View></Card>) : <Text style={styles.emptyOrders}>Submitted requests will appear here.</Text>}
  </ScrollView>;
}

function ProductCard({ product, quantity, onChangeQuantity }: { product: StoreProduct; quantity: number; onChangeQuantity: (delta: number) => void }) {
  return <Card style={styles.productCard}><View style={styles.productIcon}><Package color={colors.blue} size={22} /></View><View style={styles.productInfo}><View style={styles.productTitleRow}><Text style={styles.productName}>{product.name}</Text>{product.badge ? <Text style={styles.badge}>{product.badge}</Text> : null}</View><Text style={styles.productDescription}>{product.description || 'Branded Pixora hardware for collecting more genuine reviews.'}</Text><View style={styles.productBottom}><View><Text style={styles.productPrice}>₹{product.priceInr.toLocaleString('en-IN')}</Text>{product.comparePriceInr ? <Text style={styles.comparePrice}>₹{product.comparePriceInr.toLocaleString('en-IN')}</Text> : null}<Text style={styles.stockText}>{product.availableQty > 0 ? `${product.availableQty} available` : 'Currently unavailable'}</Text></View><QuantityControl quantity={quantity} onChange={onChangeQuantity} disabled={product.availableQty <= 0 || quantity >= product.availableQty} /></View></View></Card>;
}

function QuantityControl({ quantity, onChange, disabled = false }: { quantity: number; onChange: (delta: number) => void; disabled?: boolean }) {
  return <View style={styles.quantity}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={() => onChange(-1)} style={styles.quantityButton}><Minus color={colors.blue} size={15} /></TouchableOpacity><Text style={styles.quantityText}>{quantity}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase quantity" disabled={disabled} onPress={() => onChange(1)} style={[styles.quantityButton, disabled && styles.disabledButton]}><Plus color={colors.blue} size={15} /></TouchableOpacity></View>;
}

function StoreField({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad'; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 18, paddingBottom: 42 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.blueSoft, borderRadius: 13, borderWidth: 1, borderColor: '#DCEBFF', padding: 12, marginBottom: 15 },
  noticeText: { flex: 1, color: colors.body, fontSize: 12, lineHeight: 17 },
  productList: { gap: 11, marginBottom: 18 },
  productCard: { flexDirection: 'row', gap: 13, padding: 15 },
  productIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  productName: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  badge: { color: colors.blue, backgroundColor: colors.blueSoft, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  productDescription: { color: colors.body, fontSize: 12, lineHeight: 17, marginTop: 4 },
  productBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
  productPrice: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  comparePrice: { color: colors.muted, textDecorationLine: 'line-through', fontSize: 11, marginTop: 2 },
  stockText: { color: colors.body, fontSize: 10, marginTop: 4 },
  quantity: { height: 36, borderRadius: 11, borderWidth: 1, borderColor: '#C6DAFF', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  quantityButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  quantityText: { minWidth: 22, color: colors.ink, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  disabledButton: { opacity: 0.35 },
  cartCard: { marginBottom: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  sectionBody: { color: colors.body, fontSize: 12, marginTop: 3 },
  cartRow: { minHeight: 55, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartCopy: { flex: 1 },
  cartName: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  cartPrice: { color: colors.body, fontSize: 11, marginTop: 3 },
  formCard: { marginBottom: 18 },
  formTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  formHint: { color: colors.body, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 3 },
  field: { marginTop: 11 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 13, color: colors.ink, fontSize: 14 },
  errorBanner: { borderRadius: 12, backgroundColor: colors.dangerSoft, padding: 11, marginTop: 13, marginBottom: 13 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  successBanner: { borderRadius: 12, backgroundColor: colors.mint, padding: 11, marginTop: 13, marginBottom: 13, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  successCopy: { flex: 1 },
  successTitle: { color: colors.mintText, fontSize: 13, fontWeight: '900' },
  successBody: { color: colors.mintText, fontSize: 11, lineHeight: 16, marginTop: 2 },
  ordersTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 4, marginBottom: 10 },
  orderCard: { marginBottom: 10 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderCopy: { flex: 1 },
  orderNumber: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  orderMeta: { color: colors.body, fontSize: 11, marginTop: 4 },
  orderAmount: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  emptyOrders: { color: colors.muted, fontSize: 12, marginBottom: 18 },
});
