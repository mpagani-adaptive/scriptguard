/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/https', 'N/email'], (record, search, https, email) => {

  const afterSubmit = (context) => {
    let salesOrder = context.newRecord;

    // Validate every line with external API
    for (let i = 0; i < salesOrder.getLineCount({ sublistId: 'item' }); i++) {
      let itemId = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });

      // BAD: HTTP call inside loop
      let response = https.get({
        url: 'https://api.vendor.com/validate?item=' + itemId
      });

      if (response.code !== 200) {
        log.debug('Validation failed', 'Item ' + itemId);
      }

      // BAD: Record load inside loop
      let itemRec = record.load({ type: record.Type.INVENTORY_ITEM, id: itemId, isDynamic: true });
      let weight = itemRec.getValue('weight');

      // BAD: Search inside loop
      let vendorInfo = search.lookupFields({
        type: search.Type.VENDOR,
        id: 1234,
        columns: ['companyname', 'email']
      });

      // BAD: email inside loop
      email.send({
        author: 55,
        recipients: vendorInfo.email,
        subject: 'Item Validated',
        body: 'Item ' + itemId + ' passed validation'
      });
    }

    // BAD: Full record load + setValue + save where submitFields would work
    let orderRec = record.load({ type: record.Type.SALES_ORDER, id: salesOrder.id });
    orderRec.setValue({ fieldId: 'custbody_validated', value: true });
    orderRec.setValue({ fieldId: 'custbody_validation_date', value: new Date() });
    orderRec.save();

    // BAD: Creating records with no idempotency check
    let auditRec = record.create({ type: 'customrecord_audit_log' });
    auditRec.setValue({ fieldId: 'custrecord_audit_order', value: salesOrder.id });
    auditRec.setValue({ fieldId: 'custrecord_audit_action', value: 'validated' });
    auditRec.save();

    // BAD: Unbounded search
    let allOrders = search.create({
      type: search.Type.SALES_ORDER,
      filters: [['mainline', 'is', 'T']],
      columns: ['tranid', 'entity', 'total']
    });
    allOrders.run().each(function(result) {
      log.debug('Order', result.getValue('tranid'));
      return true;
    });
  };

  return { afterSubmit };
});
