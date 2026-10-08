import { useEffect, useState } from 'react';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import { ASSETS, shortAddr } from '../lib/model';
import { navigate } from '../lib/router';
import { resetDemo, rotateApiKey, updateMerchant, useDemo } from '../lib/store';
import { CoinMark } from '../product/Checkout';
import { Icon } from '../ui/icons';
import { Button, CopyInline, Field, Input, Modal, Segmented, Toggle, toast } from '../ui/ui';
import { PageHead } from './AppShell';

export function Settings() {
  const { t, lang, setLang } = useI18n();
  const demo = useDemo();
  const m = demo.merchant;
  const [name, setName] = useState(m.name);
  const [reveal, setReveal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  useEffect(() => setName(m.name), [m.name]);
  const nameChanged = name.trim() && name.trim() !== m.name;

  const toggleAsset = (id: (typeof ASSETS)[number]['id'], on: boolean) => {
    const next = on ? [...m.accepted, id] : m.accepted.filter((a) => a !== id);
    if (!next.length) {
      toast(t('set_need_one'), 'danger');
      return;
    }
    updateMerchant({ accepted: ASSETS.map((a) => a.id).filter((a) => next.includes(a)) });
  };

  return (
    <div className="page page-narrow">
      <PageHead title={t('nav_settings')} sub={t('set_sub')} />

      <section className="card settings-block">
        <h2>{t('set_business')}</h2>
        <form
          className="settings-inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nameChanged) return;
            updateMerchant({ name: name.trim() });
            toast(t('toast_saved'));
          }}
        >
          <Field label={t('set_name')} hint={t('set_name_hint')} htmlFor="set-name">
            <Input id="set-name" value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button type="submit" variant={nameChanged ? 'primary' : 'secondary'} disabled={!nameChanged}>
            {t('save')}
          </Button>
        </form>
      </section>

      <section className="card settings-block">
        <h2>{t('set_settlement')}</h2>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_settle_asset')}</p>
            <p className="settings-hint">{t('set_settle_asset_hint')}</p>
          </div>
          <Segmented
            label={t('set_settle_asset')}
            value={m.settleAsset}
            onChange={(v) => {
              updateMerchant({ settleAsset: v });
              toast(t('toast_saved'));
            }}
            options={[
              { value: 'USDT', label: 'USDT' },
              { value: 'USDC', label: 'USDC' },
            ]}
          />
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_wallet')}</p>
            <p className="settings-hint">{t('set_wallet_hint')}</p>
          </div>
          <CopyInline text={m.payoutWallet} display={shortAddr(m.payoutWallet, 6, 6)} />
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_schedule')}</p>
            <p className="settings-hint">{t('set_schedule_hint')}</p>
          </div>
          <span className="settings-v">{t('set_schedule_v')}</span>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_fee')}</p>
            <p className="settings-hint">{t('set_fee_hint')}</p>
          </div>
          <span className="settings-v num">{f.num(m.feeRate * 100, lang, 1)}%</span>
        </div>
      </section>

      <section className="card settings-block">
        <h2>{t('set_assets')}</h2>
        <p className="settings-lead">{t('set_assets_lead')}</p>
        <ul className="asset-toggles">
          {ASSETS.map((a) => {
            const on = m.accepted.includes(a.id);
            return (
              <li key={a.id}>
                <CoinMark coin={a.coin} size={30} />
                <span className="asset-toggle-name">
                  <b>{a.symbol}</b>
                  <span>{a.network}</span>
                </span>
                <Toggle checked={on} onChange={(v) => toggleAsset(a.id, v)} label={`${a.symbol} · ${a.network}`} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card settings-block">
        <h2>{t('set_language')}</h2>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_language_k')}</p>
            <p className="settings-hint">{t('set_language_hint')}</p>
          </div>
          <Segmented
            label={t('set_language')}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </section>

      <section className="card settings-block">
        <h2>{t('set_developers')}</h2>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_api_key')}</p>
            <p className="settings-hint">{t('set_api_key_hint')}</p>
          </div>
          <div className="api-key">
            <CopyInline text={m.apiKey} display={reveal ? m.apiKey : `${m.apiKey.slice(0, 15)}••••••••${m.apiKey.slice(-4)}`} />
            <div className="api-key-actions">
              <Button size="sm" variant="ghost" onClick={() => setReveal((v) => !v)}>
                {reveal ? t('set_hide') : t('set_show')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmRotate(true)}>
                {t('set_rotate')}
              </Button>
            </div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_webhooks')}</p>
            <p className="settings-hint">{t('set_webhooks_hint')}</p>
          </div>
          <span className="unavailable">
            <Icon name="info" size={15} />
            {t('unavailable_demo')}
          </span>
        </div>
      </section>

      <section className="card settings-block settings-danger">
        <h2>{t('set_demo')}</h2>
        <div className="settings-row">
          <div>
            <p className="settings-k">{t('set_reset')}</p>
            <p className="settings-hint">{t('set_reset_hint')}</p>
          </div>
          <Button icon="reset" onClick={() => setConfirmReset(true)}>
            {t('set_reset_btn')}
          </Button>
        </div>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('set_reset_title')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                toast(t('toast_reset'));
                navigate('/app/overview');
              }}
            >
              {t('set_reset_btn')}
            </Button>
          </>
        }
      >
        <p className="modal-lead">{t('set_reset_text')}</p>
      </Modal>

      <Modal
        open={confirmRotate}
        onClose={() => setConfirmRotate(false)}
        title={t('set_rotate_title')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRotate(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                rotateApiKey();
                setConfirmRotate(false);
                setReveal(true);
                toast(t('toast_key_rotated'));
              }}
            >
              {t('set_rotate')}
            </Button>
          </>
        }
      >
        <p className="modal-lead">{t('set_rotate_text')}</p>
      </Modal>
    </div>
  );
}
