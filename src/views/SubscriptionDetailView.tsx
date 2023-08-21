import { Box, ContextView, List, ListItem } from "@stripe/ui-extension-sdk/ui"
import type { ExtensionContextValue } from "@stripe/ui-extension-sdk/context"
import { useState, useMemo, useEffect } from 'react'
import { createHttpClient, STRIPE_API_KEY } from '@stripe/ui-extension-sdk/http_client'
import { clipboardWriteText, showToast } from '@stripe/ui-extension-sdk/utils'

import Stripe from 'stripe'
const stripe = new Stripe(STRIPE_API_KEY, {
  httpClient: createHttpClient(),
  apiVersion: '2023-08-16',
})

function getFieldValue(field?: Stripe.Checkout.Session.CustomField): string | null  {
  if (!field) return null
  switch (field.type) {
    case 'dropdown':
      return field.dropdown?.value || null
    case 'text':
      return field.text?.value || null
    case 'numeric':
      return field.numeric?.value || null
  }
}

const SubscriptionDetailView = ({environment}: ExtensionContextValue) => {
  const [customFields, setCustomFields] = useState<Array<Stripe.Checkout.Session.CustomField> | null>(null)
  const { objectContext } = environment
  const subscriptionId = useMemo(() => {
    if (!objectContext) return null
    if (objectContext.object !== 'subscription') return null
    return objectContext.id
  }, [objectContext])
  useEffect(() => {
    if (!subscriptionId) return
    stripe.checkout.sessions.list({
      subscription: subscriptionId
    }).then(({data}) => {
      if (!data) return;
      if (data[0].custom_fields) {
        setCustomFields(data[0].custom_fields)
        showToast("Copied", { type: "success" })
      }
    })

  }, [subscriptionId])
  return (
    <ContextView
      title="Custom Field View"
    >
      {customFields ? (
        <List
          onAction={id => {
            const selectedField = customFields.find(field => field.key === id)
            const fieldValue = getFieldValue(selectedField);
            if(fieldValue) clipboardWriteText(fieldValue)
          }}
        >
          {customFields.map(field => {
            const fieldValue = getFieldValue(field);
            return (
              <ListItem
                key={field.key}
                id={field.key}
                title={<Box>{field.label.custom}</Box>}
                value={fieldValue}
              />
            )
          })}
        </List>
      ): (
        <Box>
          This subscription was not created from Checkout session.
        </Box>
      )} 
    </ContextView>
  );
};

export default SubscriptionDetailView;
