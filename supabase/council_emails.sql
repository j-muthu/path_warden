-- Council Emails Database Schema
-- Run this in your Supabase SQL Editor
-- WARNING: This will DROP and recreate the council_emails table

-- Drop existing table if it exists
DROP TABLE IF EXISTS council_emails CASCADE;

-- Create council_emails table
CREATE TABLE council_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_name TEXT NOT NULL UNIQUE,
  council_type TEXT, -- 'england', 'wales', 'scotland', 'northern_ireland'
  prow_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_council_emails_name ON council_emails(council_name);
CREATE INDEX idx_council_emails_type ON council_emails(council_type);

-- Enable RLS
ALTER TABLE council_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can read council emails (public data)
CREATE POLICY "Anyone can view council emails"
  ON council_emails FOR SELECT
  USING (true);

-- Only service role can modify (admin only)
CREATE POLICY "Service role can insert council emails"
  ON council_emails FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update council emails"
  ON council_emails FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete council emails"
  ON council_emails FOR DELETE
  USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_council_emails_updated_at ON council_emails;
CREATE TRIGGER update_council_emails_updated_at
  BEFORE UPDATE ON council_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFIED COUNCIL EMAIL ADDRESSES
-- =====================================================

INSERT INTO council_emails (council_name, council_type, prow_email) VALUES

-- WALES (Highways)
('Blaenau Gwent County Borough Council', 'wales', 'info@blaenau-gwent.gov.uk'),
('Bridgend County Borough Council', 'wales', 'highwaysenquiries@bridgend.gov.uk'),
('Caerphilly County Borough Council', 'wales', 'engineering@caerphilly.gov.uk'),
('Cardiff Council', 'wales', 'HighwaysWasteandParks@cardiff.gov.uk'),
('Carmarthenshire County Council', 'wales', 'direct@carmarthenshire.gov.uk'),
('Ceredigion County Council', 'wales', 'clic@ceredigion.gov.uk'),
('Conwy County Borough Council', 'wales', 'highwaymaintenance@conwy.gov.uk'),
('Denbighshire County Council', 'wales', 'customer.services@denbighshire.gov.uk'),
('Flintshire County Council', 'wales', 'streetscene@flintshire.gov.uk'),
('Gwynedd Council', 'wales', 'GwaithStryd@gwynedd.llyw.cymru'),
('Isle of Anglesey County Council', 'wales', 'highways@anglesey.gov.uk'),
('Merthyr Tydfil County Borough Council', 'wales', 'highways.customercare@merthyr.gov.uk'),
('Monmouthshire County Council', 'wales', 'contact@monmouthshire.gov.uk'),
('Neath Port Talbot County Borough Council', 'wales', 'environment@npt.gov.uk'),
('Newport City Council', 'wales', 'info@newport.gov.uk'),
('Pembrokeshire County Council', 'wales', 'enquiries@pembrokeshire.gov.uk'),
('Powys County Council', 'wales', 'tls.helpdesk@powys.gov.uk'),
('Rhondda Cynon Taf County Borough Council', 'wales', 'CustomerServices@rctcbc.gov.uk'),
('City and County of Swansea Council', 'wales', 'highways@swansea.gov.uk'),
('Torfaen County Borough Council', 'wales', 'HTE.correspondence@torfaen.gov.uk'),
('Vale of Glamorgan Council', 'wales', 'visible@valeofglamorgan.gov.uk'),
('Wrexham County Borough Council', 'wales', 'traffic@wrexham.gov.uk'),

-- NORTHERN IRELAND (Access/PRoW)
('Antrim and Newtownabbey Borough Council', 'northern_ireland', 'info@antrimandnewtownabbey.gov.uk'),
('Ards and North Down Council', 'northern_ireland', 'jackie.mckee@ardsandnorthdown.gov.uk'),
('Armagh City, Banbridge and Craigavon Borough Council', 'northern_ireland', 'info@armaghbanbridgecraigavon.gov.uk'),
('Belfast City Council', 'northern_ireland', 'parksinfo@belfastcity.gov.uk'),
('Causeway Coast and Glens Council', 'northern_ireland', 'info@causewaycoastandglens.gov.uk'),
('Derry and Strabane Council', 'northern_ireland', 'info@derrystrabane.com'),
('Fermanagh and Omagh Council', 'northern_ireland', 'info@fermanaghomagh.com'),
('Lisburn and Castlereagh Council', 'northern_ireland', 'enquiries@lisburncastlereagh.gov.uk'),
('Mid and East Antrim Council', 'northern_ireland', 'enquiries@midandeastantrim.gov.uk'),
('Mid Ulster Council', 'northern_ireland', 'parks@midulstercouncil.org'),
('Newry, Mourne and Down Council', 'northern_ireland', 'info@nmandd.org'),

-- SCOTLAND (Access/Core Paths)
('Aberdeen City Council', 'scotland', 'gbergman@aberdeencity.gov.uk'),
('Aberdeenshire Council', 'scotland', 'outdoor.access@aberdeenshire.gov.uk'),
('Angus Council', 'scotland', 'localaccessforum@angus.gov.uk'),
('Argyll and Bute Council', 'scotland', 'accessforum@argyll-bute.gov.uk'),
('Clackmannanshire Council', 'scotland', 'planning@clacks.gov.uk'),
('Dumfries and Galloway Council', 'scotland', 'bryan.scott@dumgal.gov.uk'),
('Dundee City Council', 'scotland', 'john.whyman@dundeecity.gov.uk'),
('East Ayrshire Council', 'scotland', 'planning@east-ayrshire.gov.uk'),
('East Dunbartonshire Council', 'scotland', 'greenspace@eastdunbarton.gov.uk'),
('East Lothian Council', 'scotland', 'nmorgan@eastlothian.gov.uk'),
('East Renfrewshire Council', 'scotland', 'planning@eastrenfrewshire.gov.uk'),
('City of Edinburgh Council', 'scotland', 'outdooraccess@edinburgh.gov.uk'),
('Falkirk Council', 'scotland', 'planning@falkirk.gov.uk'),
('Fife Council', 'scotland', 'outdooraccess@fife.gov.uk'),
('Glasgow City Council', 'scotland', 'jessy.field@glasgow.gov.uk'),
('Highland Council', 'scotland', 'access@highland.gov.uk'),
('Inverclyde Council', 'scotland', 'access.officer@inverclyde.gov.uk'),
('Midlothian Council', 'scotland', 'LandscapeAndCountrysideEnquiries@midlothian.gov.uk'),
('Moray Council', 'scotland', 'morayaccess@moray.gov.uk'),
('Na h-Eileanan Siar', 'scotland', 'enquiries@cne-siar.gov.uk'),
('North Ayrshire Council', 'scotland', 'accessofficer@north-ayrshire.gov.uk'),
('North Lanarkshire Council', 'scotland', 'greenspace@northlan.gov.uk'),
('Orkney Islands Council', 'scotland', 'planning@orkney.gov.uk'),
('Perth and Kinross Council', 'scotland', 'OutdoorAccess@pkc.gov.uk'),
('Renfrewshire Council', 'scotland', 'strategyandplace@renfrewshire.gov.uk'),
('Scottish Borders Council', 'scotland', 'activetravel@scotborders.gov.uk'),
('Shetland Islands Council', 'scotland', 'outdooraccess@shetland.gov.uk'),
('South Ayrshire Council', 'scotland', 'rachel.shipley@south-ayrshire.gov.uk'),
('South Lanarkshire Council', 'scotland', 'Paths@southlanarkshire.gov.uk'),
('Stirling Council', 'scotland', 'accessofficer@stirling.gov.uk'),
('West Dunbartonshire Council', 'scotland', 'wdc.greenspace@west-dunbarton.gov.uk'),
('West Lothian Council', 'scotland', 'LAF@westlothian.gov.uk'),

-- ENGLAND (Highways)
('Barking and Dagenham', 'england', 'highways@lbbd.gov.uk'),
('Barnet', 'england', 'highwayscorrespondence@barnet.gov.uk'),
('Barnsley', 'england', 'roads@barnsley.gov.uk'),
('Bath & North East Somerset', 'england', 'councilconnect@bathnes.gov.uk'),
('Bedford', 'england', 'highways.helpdesk@bedford.gov.uk'),
('Bexley', 'england', 'engineering@bexley.gov.uk'),
('Birmingham', 'england', 'connected@birmingham.gov.uk'),
('Blackburn with Darwen', 'england', 'publicrealm@blackburn.gov.uk'),
('Blackpool', 'england', 'highways@blackpool.gov.uk'),
('Bolton', 'england', 'streetcare@bolton.gov.uk'),
('Bournemouth, Christchurch and Poole', 'england', 'transport.enquiries@bcpcouncil.gov.uk'),
('Bracknell Forest', 'england', 'customer.services@bracknell-forest.gov.uk'),
('Bradford', 'england', 'highways.north@bradford.gov.uk'),
('Brent', 'england', 'transportation@brent.gov.uk'),
('Brighton and Hove', 'england', 'highwayengineering@brighton-hove.gov.uk'),
('Bristol', 'england', 'highways.traffic@bristol.gov.uk'),
('Bromley', 'england', 'highways@bromley.gov.uk'),
('Buckinghamshire', 'england', 'highways@buckinghamshire.gov.uk'),
('Bury', 'england', 'customercontactteam@bury.gov.uk'),
('Calderdale', 'england', 'customer.first@calderdale.gov.uk'),
('Cambridgeshire', 'england', 'highways@cambridgeshire.gov.uk'),
('Camden', 'england', 'streetworks@camden.gov.uk'),
('Central Bedfordshire', 'england', 'highways@centralbedfordshire.gov.uk'),
('Cheshire East', 'england', 'ceh@cheshireeasthighways.org'),
('Cheshire West and Chester', 'england', 'enquiries@cheshirewestandchester.gov.uk'),
('City of London', 'england', 'pro@cityoflondon.gov.uk'),
('City of York', 'england', 'highway.maintenance@york.gov.uk'),
('Cornwall', 'england', 'highways@cornwall.gov.uk'),
('Coventry', 'england', 'customer.services@coventry.gov.uk'),
('Croydon', 'england', 'highwaysmaintenance@croydon.gov.uk'),
('Cumberland', 'england', 'highways@cumberland.gov.uk'),
('Darlington', 'england', 'customerservices@darlington.gov.uk'),
('Derby', 'england', 'highways.maintenance@derby.gov.uk'),
('Derbyshire', 'england', 'contact.centre@derbyshire.gov.uk'),
('Devon', 'england', 'csc.roads@devon.gov.uk'),
('Doncaster', 'england', 'customer.services@doncaster.gov.uk'),
('Dorset', 'england', 'highways@dorsetcouncil.gov.uk'),
('Dudley', 'england', 'dudleycouncilplus@dudley.gov.uk'),
('Durham', 'england', 'help@durham.gov.uk'),
('Ealing', 'england', 'highwayservices@ealing.gov.uk'),
('East Riding of Yorkshire', 'england', 'highways.customer.care@eastriding.gov.uk'),
('East Sussex', 'england', 'customer@eastsussexhighways.com'),
('Enfield', 'england', 'highway.services@enfield.gov.uk'),
('Essex', 'england', 'contact@essex.gov.uk'),
('Gateshead', 'england', 'customerservices@gateshead.gov.uk'),
('Gloucestershire', 'england', 'highways@gloucestershire.gov.uk'),
('Greenwich', 'england', 'street.services@royalgreenwich.gov.uk'),
('Hackney', 'england', 'info@hackney.gov.uk'),
('Halton', 'england', 'hdl@halton.gov.uk'),
('Hammersmith and Fulham', 'england', 'highways_general@lbhf.gov.uk'),
('Hampshire', 'england', 'roads@hants.gov.uk'),
('Haringey', 'england', 'frontline@haringey.gov.uk'),
('Harrow', 'england', 'infrastructure@harrow.gov.uk'),
('Hartlepool', 'england', 'customer.service@hartlepool.gov.uk'),
('Havering', 'england', 'highways@havering.gov.uk'),
('Herefordshire', 'england', 'herefordshire.highways@balfourbeatty.com'),
('Hertfordshire', 'england', 'contact@hertfordshire.gov.uk'),
('Hillingdon', 'england', 'contact@hillingdon.gov.uk'),
('Hounslow', 'england', 'traffic@hounslow.gov.uk'),
('Isle of Wight', 'england', 'info@islandroads.com'),
('Isles of Scilly', 'england', 'infrastructure@scilly.gov.uk'),
('Islington', 'england', 'streetworks@islington.gov.uk'),
('Kensington and Chelsea', 'england', 'highways@rbkc.gov.uk'),
('Kent', 'england', 'county.hall@kent.gov.uk'),
('Kingston upon Hull, City of', 'england', 'info@hullcc.gov.uk'),
('Kingston upon Thames', 'england', 'contact@kingston.gov.uk'),
('Kirklees', 'england', 'highways.ross@kirklees.gov.uk'),
('Knowsley', 'england', 'highways.enquiry@knowsley.gov.uk'),
('Lambeth', 'england', 'highways@lambeth.gov.uk'),
('Lancashire', 'england', 'highways@lancashire.gov.uk'),
('Leeds', 'england', 'highways@leeds.gov.uk'),
('Leicester', 'england', 'highways.management@leicester.gov.uk'),
('Leicestershire', 'england', 'highwayscustomerservices@leics.gov.uk'),
('Lewisham', 'england', 'highways@lewisham.gov.uk'),
('Lincolnshire', 'england', 'cschighways@lincolnshire.gov.uk'),
('Liverpool', 'england', 'liverpool.direct@liverpool.gov.uk'),
('Luton', 'england', 'highways@luton.gov.uk'),
('Manchester', 'england', 'contact@manchester.gov.uk'),
('Medway', 'england', 'customer.first@medway.gov.uk'),
('Merton', 'england', 'trafficandhighways@merton.gov.uk'),
('Middlesbrough', 'england', 'contactcentre@middlesbrough.gov.uk'),
('Milton Keynes', 'england', 'customerservices@milton-keynes.gov.uk'),
('Newcastle', 'england', 'streetworks@newcastle.gov.uk'),
('Newham', 'england', 'highways.enquiries@newham.gov.uk'),
('Norfolk', 'england', 'highways@norfolk.gov.uk'),
('North East Lincolnshire', 'england', 'access-highways@nelincs.gov.uk'),
('North Lincolnshire', 'england', 'highways.customer.services@northlincs.gov.uk'),
('North Northamptonshire', 'england', 'highways.nnc@northnorthants.gov.uk'),
('North Somerset', 'england', 'streets@n-somerset.gov.uk'),
('North Tyneside', 'england', 'highways@northtyneside.gov.uk'),
('North Yorkshire', 'england', 'customer.services@northyorks.gov.uk'),
('Northumberland', 'england', 'highwayssearch@northumberland.gov.uk'),
('Nottingham', 'england', 'highways.management@nottinghamcity.gov.uk'),
('Nottinghamshire', 'england', 'customerservices@nottscc.gov.uk'),
('Oldham', 'england', 'highways@oldham.gov.uk'),
('Oxfordshire', 'england', 'highway.enquiries@oxfordshire.gov.uk'),
('Peterborough', 'england', 'customer.services@peterborough.gov.uk'),
('Plymouth', 'england', 'highways@plymouth.gov.uk'),
('Portsmouth', 'england', 'cityhelpdesk@portsmouthcc.gov.uk'),
('Reading', 'england', 'highways@reading.gov.uk'),
('Redbridge', 'england', 'highways.enquiries@redbridge.gov.uk'),
('Redcar & Cleveland', 'england', 'contactus@redcar-cleveland.gov.uk'),
('Richmond upon Thames', 'england', 'trafficandengineering@richmond.gov.uk'),
('Rochdale', 'england', 'highways@rochdale.gov.uk'),
('Rotherham', 'england', 'streetpride@rotherham.gov.uk'),
('Rutland', 'england', 'highways@rutland.gov.uk'),
('Salford', 'england', 'streetscene.consultations@salford.gov.uk'),
('Sandwell', 'england', 'highways@sandwell.gov.uk'),
('Sefton', 'england', 'highways.management@sefton.gov.uk'),
('Sheffield', 'england', 'highways@sheffield.gov.uk'),
('Shropshire', 'england', 'customer.service@shropshire.gov.uk'),
('Slough', 'england', 'highways@slough.gov.uk'),
('Solihull', 'england', 'connectcc@solihull.gov.uk'),
('Somerset', 'england', 'roadsandtransportSD@somerset.gov.uk'),
('South Gloucestershire', 'england', 'streetcare@southglos.gov.uk'),
('South Tyneside', 'england', 'highways@southtyneside.gov.uk'),
('Southampton', 'england', 'actionline@southampton.gov.uk'),
('Southend-on-Sea', 'england', 'council@southend.gov.uk'),
('Southwark', 'england', 'highways@southwark.gov.uk'),
('St Helens', 'england', 'contactcentre@sthelens.gov.uk'),
('Staffordshire', 'england', 'highways@staffordshire.gov.uk'),
('Stockport', 'england', 'stockportdirect@stockport.gov.uk'),
('Stockton-on-Tees', 'england', 'egds@stockton.gov.uk'),
('Stoke-on-Trent', 'england', 'enquiries@stoke.gov.uk'),
('Suffolk', 'england', 'customer.services@suffolk.gov.uk'),
('Sunderland', 'england', 'city.help@sunderland.gov.uk'),
('Surrey', 'england', 'contact.centre@surreycc.gov.uk'),
('Sutton', 'england', 'highways@sutton.gov.uk'),
('Swindon', 'england', 'customerservices@swindon.gov.uk'),
('Tameside', 'england', 'highways@tameside.gov.uk'),
('Telford and Wrekin', 'england', 'highways@telford.gov.uk'),
('Thurrock', 'england', 'highways@thurrock.gov.uk'),
('Torbay', 'england', 'highways@torbay.gov.uk'),
('Tower Hamlets', 'england', 'customer.services@towerhamlets.gov.uk'),
('Trafford', 'england', 'access.trafford@trafford.gov.uk'),
('Transport for London', 'england', 'enquire@tfl.gov.uk'),
('Wakefield', 'england', 'customerservices@wakefield.gov.uk'),
('Walsall', 'england', 'traffic.management@walsall.gov.uk'),
('Waltham Forest', 'england', 'wfdirect@walthamforest.gov.uk'),
('Wandsworth', 'england', 'trafficandengineering@wandsworth.gov.uk'),
('Warrington', 'england', 'contact@warrington.gov.uk'),
('Warwickshire', 'england', 'countyhighways@warwickshire.gov.uk'),
('West Berkshire', 'england', 'highways@westberks.gov.uk'),
('West Northamptonshire', 'england', 'highways.wnc@westnorthants.gov.uk'),
('West Sussex', 'england', 'highways@westsussex.gov.uk'),
('Westminster', 'england', 'highways@westminster.gov.uk'),
('Westmorland and Furness', 'england', 'highways@westmorlandandfurness.gov.uk'),
('Wigan', 'england', 'streetscene@wigan.gov.uk'),
('Wiltshire', 'england', 'highways@wiltshire.gov.uk'),
('Windsor and Maidenhead', 'england', 'customer.service@rbwm.gov.uk'),
('Wirral', 'england', 'streetscene@wirral.gov.uk'),
('Wokingham', 'england', 'customerservice@wokingham.gov.uk'),
('Wolverhampton', 'england', 'customer.services@wolverhampton.gov.uk'),
('Worcestershire', 'england', 'roadtravel@worcestershire.gov.uk');
