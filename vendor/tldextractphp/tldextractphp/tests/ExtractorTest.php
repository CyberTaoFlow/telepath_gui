<?php
require_once dirname(__FILE__) . '/../tldextract.php';

class ExtractorTest extends PHPUnit_Framework_TestCase {

	private function assertExtract($expectedSubdomain, $expectedDomain, $expectedTld, $url) {
		$actual = tldextract($url);
		$this->assertEquals(
			$expectedSubdomain,
			$actual->subdomain,
			sprintf('The subdomain of "%s" should be "%s"', $url, $expectedSubdomain)
		);

		$this->assertEquals(
			$expectedDomain,
			$actual->domain,
			sprintf('The domain of "%s" should be "%s"', $url, $expectedDomain)
		);

		$this->assertEquals(
			$expectedTld,
			$actual->tld,
			sprintf('The TLD of "%s" should be "%s"', $url, $expectedTld)
		);
	}

	public function testAmerican() {
		$this->assertExtract('www', 'google', 'com', 'http://www.google.com');
	}

	public function testBritish() {
        $this->assertExtract("www", "theregister", "co.uk", "http://www.theregister.co.uk");
	}

    public function testNoSubdomain() {
        $this->assertExtract("", "gmail", "com", "http://gmail.com");
	}

    public function testNestedSubdomain() {
        $this->assertExtract("media.forums", "theregister", "co.uk", "http://media.forums.theregister.co.uk");
	}

    public function testOddButPossible() {
        $this->assertExtract('www', 'www', 'com', 'http://www.www.com');
        $this->assertExtract('', 'www', 'com', 'http://www.com');
	}

    public function testLocalHost() {
        $this->assertExtract('', '', 'wiki', 'http://wiki/');
        $this->assertExtract('wiki', 'bizarre', '', 'http://wiki.bizarre');
	}

    public function testQualifiedLocalHost() {
        $this->assertExtract('', 'wiki', 'info', 'http://wiki.info/');
        $this->assertExtract('wiki', 'information', '', 'http://wiki.information/');
	}
	
	public function testIp() {
        $this->assertExtract('', '216.22.0.192', '', 'http://216.22.0.192/');
        $this->assertExtract('216.22', 'project', 'coop', 'http://216.22.project.coop/');
	}

	public function testIPv6() {
		//IPv6 sample URLs from http://www.ietf.org/rfc/rfc2732.txt
		$this->assertExtract('', '[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]', '', 'http://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html');
		$this->assertExtract('', '[1080:0:0:0:8:800:200C:417A]', '', 'http://[1080:0:0:0:8:800:200C:417A]/index.html');
		$this->assertExtract('', '[::192.9.5.5]', '', 'http://[::192.9.5.5]/ipng');
		$this->assertExtract('', '[::FFFF:129.144.52.38]', '', 'http://[::FFFF:129.144.52.38]:80/index.html');
		$this->assertExtract('', '[2010:836B:4179::836B:4179]', '', 'http://[2010:836B:4179::836B:4179]');
	}

    public function testEmpty() {
        $this->assertExtract('', '', '', 'http://');
	}

    public function testScheme() {
        $this->assertExtract('mail', 'google', 'com', 'https://mail.google.com/mail');
        $this->assertExtract('mail', 'google', 'com', 'ssh://mail.google.com/mail');
        $this->assertExtract('mail', 'google', 'com', '//mail.google.com/mail');
        $this->assertExtract('mail', 'google', 'com', 'mail.google.com/mail');
	}

    public function testPort() {
        $this->assertExtract('www', 'github', 'com', 'git+ssh://www.github.com:8443/');
	}

    public function testUsername() {
        $this->assertExtract('1337', 'warez', 'com', 'ftp://johndoe:5cr1p7k1dd13@1337.warez.com:2501');
	}

    public function testRegexOrder() {
        $this->assertExtract('www', 'parliament', 'uk', 'http://www.parliament.uk');
        $this->assertExtract('www', 'parliament', 'co.uk', 'http://www.parliament.co.uk');
	}

    public function testUnhandledByIana() {
        $this->assertExtract('www', 'cgs', 'act.edu.au', 'http://www.cgs.act.edu.au/');
        $this->assertExtract('www', 'google', 'com.au', 'http://www.google.com.au/');
	}

    public function testTldIsAWebsiteToo() {
        $this->assertExtract('www', 'metp', 'net.cn', 'http://www.metp.net.cn');
        //$this->assertExtract('www', 'net', 'cn', 'http://www.net.cn'); // This is unhandled by the PSL. Or is it?
	}

	public function testArrayAccess() {
		$parts = tldextract('http://www.google.com/');
		$this->assertEquals('www', $parts['subdomain']);
		$this->assertEquals('google', $parts['domain']);
		$this->assertEquals('com', $parts['tld']);
	}

	/**
	 * @expectedException LogicException
	 */
	public function testArraySetException() {
		$parts = tldextract('http://www.google.com/');
		$parts['domain'] = 'yahoo';
	}

	/**
	 * @expectedException LogicException
	 */
	public function testArrayUnsetException() {
		$parts = tldextract('http://www.google.com/');
		unset($parts['domain']);
	}
}