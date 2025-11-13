const CONTACT_DEFAULTS = {
  RESEND_API_KEY: 're_XrH63bZt_2mmMuXiDyvfyt1s7C5HekYJP',
  CONTACT_TO: 'bentley.dave@gmail.com',
  CONTACT_FROM: 'Qori Labs Contact <onboarding@resend.dev>'
};

const NAME_GROUPS = {
  resendApiKey: ['RESEND_API_KEY', 'RESEND_KEY', 'VERCEL_RESEND_API_KEY', 'QORI_RESEND_API_KEY'],
  contactTo: ['CONTACT_TO', 'QORI_CONTACT_TO'],
  contactFrom: ['CONTACT_FROM', 'QORI_CONTACT_FROM']
};

const resolveEnv = (names) => {
  for (const name of names) {
    if (process.env[name]) {
      return process.env[name];
    }
  }
  return '';
};

const getContactConfig = () => ({
  resendApiKey: resolveEnv(NAME_GROUPS.resendApiKey) || CONTACT_DEFAULTS.RESEND_API_KEY,
  contactTo: resolveEnv(NAME_GROUPS.contactTo) || CONTACT_DEFAULTS.CONTACT_TO,
  contactFrom: resolveEnv(NAME_GROUPS.contactFrom) || CONTACT_DEFAULTS.CONTACT_FROM
});

module.exports = {
  getContactConfig
};
