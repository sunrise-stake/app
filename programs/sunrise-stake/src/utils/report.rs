use anchor_lang::prelude::*;
use crate::instructions::ExtractToTreasury;
use crate::state::EpochReportAccount;

impl<'a> From<ExtractToTreasury<'a>> for UpdateEpochReportProperties<'a> {
    fn from(extract_to_treasury: ExtractToTreasury<'a>) -> Self {
        Self {
            epoch_report_account: extract_to_treasury.epoch_report_account,
            previous_epoch_report_account: extract_to_treasury.previous_epoch_report_account,
        }
    }
}
impl<'a> From<&ExtractToTreasury<'a>> for UpdateEpochReportProperties<'a> {
    fn from(extract_to_treasury: &ExtractToTreasury<'a>) -> Self {
        extract_to_treasury.to_owned().into()
    }
}
pub struct UpdateEpochReportProperties<'info> {
    epoch_report_account: Box<Account<'info, EpochReportAccount>>,
    previous_epoch_report_account: Box<Account<'info, EpochReportAccount>>,
}
pub fn update_epoch_report(mut accounts: &mut UpdateEpochReportProperties, extracted_yield: u64) -> Result<()> {
    accounts.epoch_report_account.add_extracted_yield(extracted_yield);
    Ok(())
}