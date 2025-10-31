-- Seed default admin config (will be preserved after database reset)
INSERT INTO admin_config (key, value) 
VALUES (
  'dashboard_config',
  '{"gmail":{"uniplaySenderEmail":"alventsaint1@gmail.com"},"topup":{"apiKey":"","merchantId":"","provider":"unipin","secretKey":""},"uniplay":{"apiKey":"","baseUrl":"https://api-reseller.uniplay.id/v1","pincode":""},"whatsapp":{"fonnteToken":"YOUR_FONNTE_TOKEN_HERE","phoneNumber":"","webhookUrl":""}}'
)
ON CONFLICT (key) DO NOTHING;

-- Seed default CS number
INSERT INTO whatsapp_cs_numbers (phone_number, admin_name, is_active, added_by)
VALUES ('62818848168', 'Alvent', true, 'system')
ON CONFLICT (phone_number) DO NOTHING;
